-- ============================================================
--  MedLens — Supabase schema, security policies and seed data
--  Run this whole file in the Supabase SQL Editor (one shot).
--  Safe to re-run: it drops and recreates the MedLens objects.
-- ============================================================

-- ---------- clean slate (MedLens objects only) ----------
drop table if exists public.lessons  cascade;
drop table if exists public.sections cascade;
drop table if exists public.chapters cascade;
drop table if exists public.profiles cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.touch_updated_at() cascade;

-- ---------- helper: updated_at ----------
create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ============================================================
--  PROFILES  (every auth user gets one; role gates the CMS)
-- ============================================================
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'viewer' check (role in ('viewer','admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- create a profile automatically on signup
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- admin check, used by every write policy below
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- you may read your own profile; admins may read all
create policy "profiles read own"  on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles admin write" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ============================================================
--  CONTENT  chapters -> sections -> lessons
-- ============================================================
create table public.chapters (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  subtitle    text,
  category    text not null default 'systems' check (category in ('foundations','systems')),
  status      text not null default 'draft'   check (status in ('draft','published')),
  order_index int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.sections (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  uuid not null references public.chapters(id) on delete cascade,
  numeral     text,
  title       text not null,
  order_index int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.sections (chapter_id);

create table public.lessons (
  id          uuid primary key default gen_random_uuid(),
  section_id  uuid not null references public.sections(id) on delete cascade,
  title       text not null,
  slug        text,
  lenses      text[] not null default '{}',
  state       text not null default 'new' check (state in ('new','prog','done')),
  order_index int  not null default 0,
  content     jsonb,          -- filled later by the Claude API generator
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.lessons (section_id);

create trigger t_chapters_touch before update on public.chapters
  for each row execute function public.touch_updated_at();
create trigger t_sections_touch before update on public.sections
  for each row execute function public.touch_updated_at();
create trigger t_lessons_touch  before update on public.lessons
  for each row execute function public.touch_updated_at();

alter table public.chapters enable row level security;
alter table public.sections enable row level security;
alter table public.lessons  enable row level security;

-- ---------- READ: published content is public; admins see everything ----------
create policy "chapters public read" on public.chapters
  for select using (status = 'published' or public.is_admin());

create policy "sections public read" on public.sections
  for select using (
    public.is_admin() or exists (
      select 1 from public.chapters c
      where c.id = sections.chapter_id and c.status = 'published'));

create policy "lessons public read" on public.lessons
  for select using (
    public.is_admin() or exists (
      select 1 from public.sections s
      join public.chapters c on c.id = s.chapter_id
      where s.id = lessons.section_id and c.status = 'published'));

-- ---------- WRITE: admins only (insert / update / delete) ----------
create policy "chapters admin write" on public.chapters
  for all using (public.is_admin()) with check (public.is_admin());
create policy "sections admin write" on public.sections
  for all using (public.is_admin()) with check (public.is_admin());
create policy "lessons admin write"  on public.lessons
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- grants (Data API roles) ----------
grant usage on schema public to anon, authenticated;
grant select on public.chapters, public.sections, public.lessons to anon, authenticated;
grant insert, update, delete on public.chapters, public.sections, public.lessons to authenticated;
grant select, update on public.profiles to authenticated;

-- ============================================================
--  SEED  (your existing MedLens content)
-- ============================================================

insert into public.chapters (slug,title,subtitle,category,status,order_index) values ('cardiology','Cardiology','Anatomy & physiology, ischemia, arrhythmias, murmurs, heart failure, congenital disease, hypertension and more.','systems','published',7);
insert into public.sections (chapter_id,numeral,title,order_index)
select c.id, v.numeral, v.title, v.ord
from public.chapters c,
 (values
  ('I','Anatomy & Physiology',0),
  ('II','Ischemic Heart Disease',1),
  ('III','Arrhythmias & EKG',2),
  ('IV','Heart Sounds & Murmurs',3),
  ('V','Heart Failure',4),
  ('VI','Congenital Heart Disease',5),
  ('VII','Hypertension',6),
  ('VIII','Other Cardiac Disease',7)
 ) as v(numeral,title,ord)
where c.slug = 'cardiology';
insert into public.lessons (section_id,title,slug,lenses,state,order_index)
select s.id, v.title, v.slug, v.lenses, v.state, v.ord
from public.sections s
join public.chapters c on c.id = s.chapter_id
join (values
  ('I',0,'Cardiac Anatomy','cardiac-anatomy',array['anatomy'],'done'),
  ('I',1,'Cardiac Physiology','cardiac-physiology',array['physio'],'done'),
  ('I',2,'CV Response to Exercise','cv-response-to-exercise',array['physio'],'done'),
  ('I',3,'Blood Flow Mechanics','blood-flow-mechanics',array['physio'],'done'),
  ('I',4,'Regulation of Blood Pressure','regulation-of-blood-pressure',array['physio'],'done'),
  ('I',5,'Pressure-Volume (PV) Loops','pv-loops',array['physio','patho'],'done'),
  ('I',6,'Wiggers'' Diagram','wiggers-diagram',array['physio'],'prog'),
  ('I',7,'Venous Pressure Tracings','venous-pressure-tracings',array['physio'],'new'),
  ('I',8,'Starling Curve','starling-curve',array['physio'],'new'),
  ('II',0,'Cardiac Ischemia','cardiac-ischemia',array['patho','physio'],'done'),
  ('II',1,'STEMI','stemi',array['patho','pharm'],'done'),
  ('II',2,'Unstable Angina / NSTEMI','unstable-angina-nstemi',array['patho'],'prog'),
  ('II',3,'Stable Angina','stable-angina',array['patho'],'new'),
  ('III',0,'EKG Basics','ekg-basics',array['physio'],'done'),
  ('III',1,'High-Yield EKGs','high-yield-ekgs',array['patho','physio'],'prog'),
  ('III',2,'Action Potentials','action-potentials',array['physio','pharm'],'done'),
  ('III',3,'AV & Bundle Branch Blocks','av-and-bundle-branch-blocks',array['patho','physio'],'new'),
  ('III',4,'Atrial Fibrillation','atrial-fibrillation',array['patho'],'new'),
  ('III',5,'AVNRT','avnrt',array['physio','patho'],'new'),
  ('III',6,'WPW (Wolff-Parkinson-White)','wpw-wolff-parkinson-white',array['physio','patho'],'new'),
  ('III',7,'Antiarrhythmic Drugs','antiarrhythmic-drugs',array['pharm'],'new'),
  ('IV',0,'Heart Sounds','heart-sounds',array['physio'],'done'),
  ('IV',1,'Heart Murmurs','heart-murmurs',array['patho','physio'],'prog'),
  ('V',0,'Heart Failure Basics','heart-failure-basics',array['patho'],'new'),
  ('V',1,'Systolic & Diastolic Heart Failure','systolic-and-diastolic-heart-failure',array['patho','physio'],'new'),
  ('V',2,'Restrictive Cardiomyopathy','restrictive-cardiomyopathy',array['patho'],'new'),
  ('V',3,'Acute Heart Failure','acute-heart-failure',array['patho','pharm'],'new'),
  ('V',4,'Chronic Heart Failure','chronic-heart-failure',array['patho','pharm'],'new'),
  ('VI',0,'Cardiac Embryology','cardiac-embryology',array['embryo'],'new'),
  ('VI',1,'Shunts','shunts',array['embryo','patho'],'new'),
  ('VI',2,'Cyanotic Congenital Heart Disease','cyanotic-congenital-heart-disease',array['embryo','patho'],'new'),
  ('VI',3,'Coarctation of the Aorta','coarctation-of-the-aorta',array['embryo','anatomy'],'new'),
  ('VII',0,'Hypertension','hypertension',array['patho','physio'],'new'),
  ('VII',1,'Secondary Hypertension','secondary-hypertension',array['patho'],'new'),
  ('VII',2,'Hypertension Drugs','hypertension-drugs',array['pharm'],'new'),
  ('VIII',0,'Valve Disease','valve-disease',array['patho'],'new'),
  ('VIII',1,'Shock','shock',array['physio','patho'],'new'),
  ('VIII',2,'Pericardial Disease','pericardial-disease',array['patho'],'new'),
  ('VIII',3,'Aortic Dissection','aortic-dissection',array['patho','anatomy'],'new'),
  ('VIII',4,'Cardiac Tumors','cardiac-tumors',array['patho'],'new'),
  ('VIII',5,'Hypertrophic Cardiomyopathy','hypertrophic-cardiomyopathy',array['patho'],'new'),
  ('VIII',6,'Endocarditis','endocarditis',array['patho','micro'],'new')
 ) as v(sec_numeral,ord,title,slug,lenses,state)
  on v.sec_numeral = s.numeral
where c.slug = 'cardiology';

insert into public.chapters (slug,title,subtitle,category,status,order_index) values ('respiratory','Respiratory','Lung volumes, V/Q matching, obstructive vs restrictive disease, and control of breathing.','systems','published',8);
insert into public.sections (chapter_id,numeral,title,order_index)
select c.id, v.numeral, v.title, v.ord
from public.chapters c,
 (values
  ('I','Lung Volumes & Mechanics',0),
  ('II','Gas Exchange',1),
  ('III','Obstructive & Restrictive Disease',2),
  ('IV','Development',3)
 ) as v(numeral,title,ord)
where c.slug = 'respiratory';
insert into public.lessons (section_id,title,slug,lenses,state,order_index)
select s.id, v.title, v.slug, v.lenses, v.state, v.ord
from public.sections s
join public.chapters c on c.id = s.chapter_id
join (values
  ('I',0,'Lung Volumes & Capacities','lung-volumes-and-capacities',array['physio'],'done'),
  ('I',1,'Spirometry','spirometry',array['physio'],'prog'),
  ('I',2,'Compliance & Elastance','compliance-and-elastance',array['physio'],'new'),
  ('II',0,'V/Q Matching','v-q-matching',array['physio'],'new'),
  ('II',1,'Oxygen & CO₂ Transport','oxygen-and-co-transport',array['physio','biochem'],'new'),
  ('III',0,'Obstructive vs Restrictive','obstructive-vs-restrictive',array['patho','physio'],'new'),
  ('III',1,'Asthma & COPD','asthma-and-copd',array['patho','pharm'],'new'),
  ('IV',0,'Lung Development & Surfactant','lung-development-and-surfactant',array['embryo'],'new')
 ) as v(sec_numeral,ord,title,slug,lenses,state)
  on v.sec_numeral = s.numeral
where c.slug = 'respiratory';

insert into public.chapters (slug,title,subtitle,category,status,order_index) values ('biochemistry','Biochemistry','Metabolism, enzymes, molecular biology, and the vitamins that keep showing up in vignettes.','foundations','draft',1);

insert into public.chapters (slug,title,subtitle,category,status,order_index) values ('genetics','Genetics','Inheritance patterns, trinucleotide repeats, imprinting, and population genetics.','foundations','draft',2);

-- ============================================================
--  BOOTSTRAP YOUR ADMIN
--  1) Create a user: Authentication > Users > Add user (email+password),
--     OR sign up once through login.html.
--  2) Promote that user to admin (replace the email):
--       update public.profiles set role = 'admin' where email = 'you@example.com';
--  Without this, the dashboard will load read-only (writes are blocked by RLS).
-- ============================================================
