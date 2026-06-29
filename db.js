// =============================================================
//  MedLens data layer
//  One API for the whole app. Talks to Supabase when configured
//  (config.js filled in), otherwise runs a fully-working in-browser
//  DEMO so the dashboard is explorable before any backend exists.
// =============================================================
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";
import { SEED } from "./seed.js";

const configured =
  SUPABASE_URL && SUPABASE_KEY &&
  !/YOUR_/.test(SUPABASE_URL) && !/YOUR_/.test(SUPABASE_KEY) &&
  /^https?:\/\//.test(SUPABASE_URL);

export const MODE = configured ? "live" : "demo";

let supabase = null;
if (configured) {
  // esm.sh is used (not jsDelivr +esm) because the jsDelivr ESM build of
  // supabase-js v2 has a known runtime bug with its null default exports.
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ---------- shared constants ----------
export const DISCIPLINES = [
  { key: "anatomy", label: "Anatomy" },
  { key: "embryo",  label: "Embryology" },
  { key: "histo",   label: "Histology" },
  { key: "physio",  label: "Physiology" },
  { key: "patho",   label: "Pathology" },
  { key: "pharm",   label: "Pharmacology" },
  { key: "micro",   label: "Microbiology" },
  { key: "biochem", label: "Biochemistry" },
];
export const STATES = [
  { key: "new",  label: "Not started" },
  { key: "prog", label: "In progress" },
  { key: "done", label: "Done" },
];
export const CATEGORIES = [
  { key: "foundations", label: "Foundations" },
  { key: "systems",     label: "Organ systems" },
];

const byOrder = (a, b) => (a.order_index - b.order_index) || (a.title || "").localeCompare(b.title || "");
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Math.random().toString(36).slice(2));
const LENS_KEYS = DISCIPLINES.map(d => d.key);
export function slugify(s) {
  return (s || "").toLowerCase().replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// =============================================================
//  DEMO STORE (only used when MODE === 'demo')
// =============================================================
const LS_DATA = "medlens-demo-data-v1";
const LS_USER = "medlens-demo-user-v1";
let store = null;
let _demoUser = null;

function freshStore() {
  const chapters = [], sections = [], lessons = [];
  for (const c of SEED) {
    const cid = uid();
    chapters.push({ id: cid, slug: c.slug, title: c.title, subtitle: c.subtitle,
      category: c.category, status: c.status, order_index: c.order_index });
    for (const s of c.sections) {
      const sid = uid();
      sections.push({ id: sid, chapter_id: cid, numeral: s.numeral, title: s.title, order_index: s.order_index });
      for (const l of s.lessons) {
        lessons.push({ id: uid(), section_id: sid, title: l.title, slug: l.slug,
          lenses: (l.lenses || []).slice(), state: l.state, order_index: l.order_index,
          published: false, content: null });
      }
    }
  }
  return { chapters, sections, lessons };
}
function loadStore() { try { const r = localStorage.getItem(LS_DATA); if (r) return JSON.parse(r); } catch (e) {} return null; }
function saveStore() { try { localStorage.setItem(LS_DATA, JSON.stringify(store)); } catch (e) {} }
if (MODE === "demo") { store = loadStore() || freshStore(); saveStore(); }

export function resetDemo() { if (MODE === "demo") { store = freshStore(); saveStore(); } }

function nextOrder(rows) { return rows.length ? Math.max(...rows.map(r => r.order_index)) + 1 : 0; }

// ---------- demo auth ----------
function getDemoUser() {
  if (_demoUser) return _demoUser;
  try { const r = localStorage.getItem(LS_USER); if (r) _demoUser = JSON.parse(r); } catch (e) {}
  return _demoUser;
}
function setDemoUser(email) { _demoUser = { id: "demo-user", email: email || "demo@medlens.app" }; try { localStorage.setItem(LS_USER, JSON.stringify(_demoUser)); } catch (e) {} }
function clearDemoUser() { _demoUser = null; try { localStorage.removeItem(LS_USER); } catch (e) {} }

// =============================================================
//  AUTH
// =============================================================
export const auth = {
  async getUser() {
    if (MODE === "demo") return getDemoUser();
    const { data } = await supabase.auth.getUser();
    return data.user;
  },
  async signIn(email, password) {
    if (MODE === "demo") { setDemoUser(email); return { id: "demo-user", email }; }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },
  async signOut() {
    if (MODE === "demo") { clearDemoUser(); return; }
    await supabase.auth.signOut();
  },
  async isAdmin() {
    if (MODE === "demo") return true;
    const u = await this.getUser();
    if (!u) return false;
    const { data, error } = await supabase.from("profiles").select("role").eq("id", u.id).single();
    if (error) return false;
    return data?.role === "admin";
  },
};

// =============================================================
//  CHAPTERS
// =============================================================
export async function listChapters() {
  if (MODE === "demo") return [...store.chapters].sort(byOrder);
  const { data, error } = await supabase.from("chapters").select("*").order("order_index");
  if (error) throw error; return data;
}
export async function createChapter(p) {
  const row = { title: p.title?.trim() || "Untitled chapter", slug: p.slug?.trim() || "",
    subtitle: p.subtitle || "", category: p.category || "systems",
    status: p.status || "draft" };
  if (MODE === "demo") {
    const r = { id: uid(), order_index: nextOrder(store.chapters), ...row };
    store.chapters.push(r); saveStore(); return r;
  }
  if (!row.order_index) { const c = await listChapters(); row.order_index = nextOrder(c); }
  const { data, error } = await supabase.from("chapters").insert(row).select().single();
  if (error) throw error; return data;
}
export async function updateChapter(id, p) {
  if (MODE === "demo") { const r = store.chapters.find(c => c.id === id); Object.assign(r, p); saveStore(); return r; }
  const { data, error } = await supabase.from("chapters").update(p).eq("id", id).select().single();
  if (error) throw error; return data;
}
export async function deleteChapter(id) {
  if (MODE === "demo") {
    const secIds = store.sections.filter(s => s.chapter_id === id).map(s => s.id);
    store.lessons = store.lessons.filter(l => !secIds.includes(l.section_id));
    store.sections = store.sections.filter(s => s.chapter_id !== id);
    store.chapters = store.chapters.filter(c => c.id !== id); saveStore(); return;
  }
  const { error } = await supabase.from("chapters").delete().eq("id", id);
  if (error) throw error;
}

// =============================================================
//  SECTIONS
// =============================================================
export async function listSections(chapterId) {
  if (MODE === "demo") return store.sections.filter(s => s.chapter_id === chapterId).sort(byOrder);
  const { data, error } = await supabase.from("sections").select("*").eq("chapter_id", chapterId).order("order_index");
  if (error) throw error; return data;
}
export async function createSection(chapterId, p) {
  const row = { chapter_id: chapterId, numeral: p.numeral || "", title: p.title?.trim() || "Untitled section" };
  if (MODE === "demo") {
    const sibs = store.sections.filter(s => s.chapter_id === chapterId);
    const r = { id: uid(), order_index: nextOrder(sibs), ...row };
    store.sections.push(r); saveStore(); return r;
  }
  const sibs = await listSections(chapterId); row.order_index = nextOrder(sibs);
  const { data, error } = await supabase.from("sections").insert(row).select().single();
  if (error) throw error; return data;
}
export async function updateSection(id, p) {
  if (MODE === "demo") { const r = store.sections.find(s => s.id === id); Object.assign(r, p); saveStore(); return r; }
  const { data, error } = await supabase.from("sections").update(p).eq("id", id).select().single();
  if (error) throw error; return data;
}
export async function deleteSection(id) {
  if (MODE === "demo") {
    store.lessons = store.lessons.filter(l => l.section_id !== id);
    store.sections = store.sections.filter(s => s.id !== id); saveStore(); return;
  }
  const { error } = await supabase.from("sections").delete().eq("id", id);
  if (error) throw error;
}

// =============================================================
//  LESSONS
// =============================================================
export async function listLessons(sectionId) {
  if (MODE === "demo") return store.lessons.filter(l => l.section_id === sectionId).sort(byOrder);
  const { data, error } = await supabase.from("lessons").select("*").eq("section_id", sectionId).order("order_index");
  if (error) throw error; return data;
}
export async function createLesson(sectionId, p) {
  const row = { section_id: sectionId, title: p.title?.trim() || "Untitled lesson",
    slug: p.slug || "", lenses: p.lenses || [], state: p.state || "new" };
  if (MODE === "demo") {
    const sibs = store.lessons.filter(l => l.section_id === sectionId);
    const r = { id: uid(), order_index: nextOrder(sibs), content: null, ...row };
    store.lessons.push(r); saveStore(); return r;
  }
  const sibs = await listLessons(sectionId); row.order_index = nextOrder(sibs);
  const { data, error } = await supabase.from("lessons").insert(row).select().single();
  if (error) throw error; return data;
}
export async function updateLesson(id, p) {
  if (MODE === "demo") { const r = store.lessons.find(l => l.id === id); Object.assign(r, p); saveStore(); return r; }
  const { data, error } = await supabase.from("lessons").update(p).eq("id", id).select().single();
  if (error) throw error; return data;
}
export async function deleteLesson(id) {
  if (MODE === "demo") { store.lessons = store.lessons.filter(l => l.id !== id); saveStore(); return; }
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) throw error;
}

// ---------- counts for the chapters list ----------
export async function counts() {
  let secs, les;
  if (MODE === "demo") { secs = store.sections; les = store.lessons; }
  else {
    const a = await supabase.from("sections").select("id,chapter_id");
    const b = await supabase.from("lessons").select("id,section_id");
    secs = a.data || []; les = b.data || [];
  }
  const secToChap = {}; const perChapter = {}; const perSection = {};
  secs.forEach(s => { secToChap[s.id] = s.chapter_id; perChapter[s.chapter_id] = perChapter[s.chapter_id] || { sections: 0, lessons: 0 }; perChapter[s.chapter_id].sections++; });
  les.forEach(l => { perSection[l.section_id] = (perSection[l.section_id] || 0) + 1; const ch = secToChap[l.section_id]; if (ch) { perChapter[ch] = perChapter[ch] || { sections: 0, lessons: 0 }; perChapter[ch].lessons++; } });
  return { perChapter, perSection };
}

// ---------- nested read for the public page ----------
export async function getChapterTree(slug) {
  if (MODE === "demo") {
    const c = store.chapters.find(x => x.slug === slug);
    if (!c) return null;
    const sections = store.sections.filter(s => s.chapter_id === c.id).sort(byOrder)
      .map(s => ({ ...s, lessons: store.lessons.filter(l => l.section_id === s.id).sort(byOrder) }));
    return { ...c, sections };
  }
  const { data: c } = await supabase.from("chapters").select("*").eq("slug", slug).single();
  if (!c) return null;
  const { data: secs } = await supabase.from("sections").select("*").eq("chapter_id", c.id).order("order_index");
  const ids = (secs || []).map(s => s.id);
  let les = [];
  if (ids.length) { const r = await supabase.from("lessons").select("*").in("section_id", ids).order("order_index"); les = r.data || []; }
  const bySec = {}; les.forEach(l => { (bySec[l.section_id] || (bySec[l.section_id] = [])).push(l); });
  return { ...c, sections: (secs || []).map(s => ({ ...s, lessons: bySec[s.id] || [] })) };
}

// =============================================================
//  LESSON CONTENT GENERATION  (Claude API via Edge Function)
// =============================================================

// gather existing slugs so generated URLs never collide
async function allLessonSlugs(exceptId) {
  let rows;
  if (MODE === "demo") rows = store.lessons;
  else { const { data } = await supabase.from("lessons").select("id,slug"); rows = data || []; }
  return rows.filter(l => l.id !== exceptId).map(l => l.slug).filter(Boolean);
}
export async function uniqueLessonSlug(base, exceptId) {
  let s = slugify(base) || "lesson";
  const taken = new Set(await allLessonSlugs(exceptId));
  if (!taken.has(s)) return s;
  let i = 2; while (taken.has(`${s}-${i}`)) i++;
  return `${s}-${i}`;
}

export async function setLessonPublished(id, published) {
  return updateLesson(id, { published: !!published });
}

export async function getLessonBySlug(slug) {
  if (MODE === "demo") {
    const l = store.lessons.find(x => x.slug === slug);
    if (!l) return null;
    const section = store.sections.find(s => s.id === l.section_id) || null;
    const chapter = section ? store.chapters.find(c => c.id === section.chapter_id) || null : null;
    return { ...l, section, chapter };
  }
  const { data: l } = await supabase.from("lessons").select("*").eq("slug", slug).single();
  if (!l) return null;
  const { data: section } = await supabase.from("sections").select("*").eq("id", l.section_id).single();
  let chapter = null;
  if (section) { const r = await supabase.from("chapters").select("*").eq("id", section.chapter_id).single(); chapter = r.data; }
  return { ...l, section, chapter };
}

// Generate a lesson's content. Live = Supabase Edge Function (real Claude API);
// demo = a local sample so the whole flow is previewable with no backend.
export async function generateLesson(lessonId, name, currentLenses) {
  if (MODE === "demo") {
    await new Promise(r => setTimeout(r, 900));   // mimic latency
    const content = sampleContent(name, currentLenses);
    const slug = await uniqueLessonSlug(name, lessonId);
    const patch = { content, slug };
    if (Array.isArray(content.lenses) && content.lenses.length && (!currentLenses || !currentLenses.length))
      patch.lenses = content.lenses.filter(k => LENS_KEYS.includes(k));
    await updateLesson(lessonId, patch);
    return { content, slug };
  }
  // live: the Edge Function writes the lesson in the background and saves it;
  // we kick it off, then poll the row until the new content lands.
  const before = await supabase.from("lessons").select("updated_at").eq("id", lessonId).single();
  const prevUpdated = before.data ? before.data.updated_at : null;
  const { data, error } = await supabase.functions.invoke("generate-lesson", { body: { name, lessonId } });
  if (error) throw new Error(error.message || "Generation request failed");
  if (data && data.error) throw new Error(data.error);
  const start = Date.now();
  while (Date.now() - start < 130000) {
    await new Promise(r => setTimeout(r, 3500));
    const { data: row } = await supabase.from("lessons").select("updated_at, content, slug").eq("id", lessonId).single();
    if (row && row.content && row.updated_at !== prevUpdated) return { content: row.content, slug: row.slug };
  }
  throw new Error("Still generating — give it a moment, then refresh the page to see it.");
}

// --- demo-only sample content (mirrors the Edge Function's JSON shape) ---
function sampleContent(name, lenses) {
  const L = (lenses && lenses.length) ? lenses : ["physio", "patho", "patho", "pharm"];
  const pick = i => L[Math.min(i, L.length - 1)] || "physio";
  return {
    sample: true,
    subtitle: `A ground-up walk through ${name} for USMLE Step 1 — built from mechanism to bedside.`,
    lenses: Array.from(new Set(L)),
    readingTime: 8,
    glance: [
      `${name} is best understood by starting from normal structure and function, then asking what breaks.`,
      "Every clinical finding below traces back to a single underlying mechanism.",
      "The exam rewards reasoning from mechanism, not memorized lists.",
    ],
    sections: [
      {
        lens: pick(0), title: "Foundations: the normal picture",
        blocks: [
          { type: "anchor", text: `Think of *${name}* the way you'd think about a machine before it jams: learn what each part does when everything works, and the failures later will feel obvious instead of arbitrary.` },
          { type: "prose", text: `Before anything goes wrong, you have to see the normal state clearly. **Set up the baseline first** — the questions that feel like memorization usually collapse into one mechanism once the normal picture is in place. On the exam, ==a stem that gives you a normal value and changes one variable== is really asking you to predict the next step in this baseline.` },
          { type: "figure", caption: "Schematic: the normal control loop holds the set point steady.", svg: '<svg viewBox="0 0 460 150" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="2"><rect x="20" y="55" width="110" height="40" rx="8"/><rect x="175" y="55" width="110" height="40" rx="8"/><rect x="330" y="55" width="110" height="40" rx="8"/><path d="M130 75h40M285 75h40" stroke-linecap="round"/><path d="M165 70l10 5-10 5M320 70l10 5-10 5" stroke-linejoin="round"/><path d="M385 95v30H75V95" stroke-dasharray="5 5"/><path d="M70 110l5 10 5-10" stroke-linejoin="round"/></g><g font-family="sans-serif" font-size="13" fill="currentColor" text-anchor="middle"><text x="75" y="79">Sensor</text><text x="230" y="79">Set point</text><text x="385" y="79">Effector</text><text x="230" y="140" font-size="11">negative feedback</text></g></svg>' },
          { type: "callout", variant: "exam", title: "How they ask it", text: "Step 1 often gives you a normal-physiology stem and asks you to predict the *first* change when one variable is perturbed. Reason forward from the baseline." },
        ],
      },
      {
        lens: pick(1), title: "Mechanism: what actually breaks",
        blocks: [
          { type: "prose", text: `Now perturb the system. The core lesion in ${name} produces a predictable cascade: the initial insult shifts one variable, ==compensation kicks in==, and the compensation itself explains many of the downstream findings. Trace the arrow — don't jump to the diagnosis.` },
          { type: "callout", variant: "pitfall", title: "Classic trap", text: "Students attribute a finding to the disease directly when it's really the *compensation* that produces it. The distractor option is the direct effect; the credited answer is the compensatory one." },
        ],
      },
      {
        lens: pick(2), title: "How patients present",
        blocks: [
          { type: "prose", text: "Presentation is just mechanism made visible. Each symptom and sign maps back to a step in the cascade above, which is why a single vignette can list several findings that all share one cause." },
          { type: "compare", columns: ["Early", "Late"], rows: [
            ["Dominant driver", "Compensation intact", "Compensation exhausted"],
            ["Typical finding", "Subtle / exertional", "Overt / at rest"],
            ["Reversibility", "Often reversible", "Often fixed"],
          ] },
          { type: "callout", variant: "mnemonic", title: "Memory hook", text: "Tie the findings to the cascade order — if you can recite the mechanism, the sign list reconstructs itself." },
        ],
      },
      {
        lens: pick(3), title: "Diagnosis & management",
        blocks: [
          { type: "prose", text: `Diagnosis confirms the mechanism you already predicted; treatment targets the step in the cascade you can most safely interrupt. For ${name}, work through it in order:` },
          { type: "list", ordered: true, items: [
            "Confirm the mechanism with the single most specific test.",
            "Interrupt the earliest reversible step in the cascade.",
            "Manage the downstream consequences once compensation fails.",
          ] },
          { type: "callout", variant: "clinical", title: "Clinical correlation", text: "First-line management usually addresses the earliest reversible step; later therapy manages the consequences once compensation has failed." },
        ],
      },
    ],
    highYield: [
      `Start every ${name} question from the normal baseline, then perturb one variable.`,
      "Distinguish the direct effect of the lesion from its compensatory response — exams test the difference.",
      "Each clinical finding maps to a specific step in the mechanism; learn the chain, not the list.",
      "Match treatments to the step of the cascade they interrupt.",
      "Second-order questions ask the mechanism of the answer you just chose — be ready to justify it.",
    ],
  };
}
