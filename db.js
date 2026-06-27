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
          lenses: (l.lenses || []).slice(), state: l.state, order_index: l.order_index, content: null });
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
