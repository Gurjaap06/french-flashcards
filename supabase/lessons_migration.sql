-- ============================================================
-- LESSONS MIGRATION
--
-- Run this ONCE in Supabase SQL Editor.
-- Back up your database before running it.
-- ============================================================

begin;


-- ============================================================
-- 1. LESSONS
-- ============================================================

create table public.lessons (
  id uuid primary key default gen_random_uuid(),

  language_code text not null,
  slug text not null,

  title text not null,
  description text not null default '',

  level text not null default 'A1',
  order_index integer not null,

  content jsonb not null default '[]'::jsonb,

  published boolean not null default true,

  created_at timestamptz not null default now(),

  constraint lessons_language_code_check
    check (language_code ~ '^[a-z]{2,3}$'),

  constraint lessons_order_positive
    check (order_index > 0),

  constraint lessons_language_slug_unique
    unique (language_code, slug),

  constraint lessons_language_order_unique
    unique (language_code, order_index)
);


create index lessons_language_code_idx
  on public.lessons (language_code);


-- ============================================================
-- 2. LESSON WORDS
--
-- Lesson vocabulary is kept as course content here.
--
-- When the user clicks "Add to Flashcards", main.js will use
-- the existing global_words system and findOrCreateGlobalWord().
-- ============================================================

create table public.lesson_words (
  id uuid primary key default gen_random_uuid(),

  lesson_id uuid not null
    references public.lessons(id)
    on delete cascade,

  target_word text not null,
  translation text not null,

  example text not null default '',
  category text not null default 'lesson',
  gender text not null default 'none',

  difficulty integer not null default 1,
  position integer not null,

  created_at timestamptz not null default now(),

  constraint lesson_words_difficulty_check
    check (difficulty between 1 and 5),

  constraint lesson_words_position_positive
    check (position > 0),

  constraint lesson_words_position_unique
    unique (lesson_id, position)
);


create index lesson_words_lesson_id_idx
  on public.lesson_words (lesson_id);


-- ============================================================
-- 3. USER LESSON PROGRESS
-- ============================================================

create table public.user_lesson_progress (
  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  lesson_id uuid not null
    references public.lessons(id)
    on delete cascade,

  status text not null default 'not_started',

  score integer null,

  completed_at timestamptz null,

  updated_at timestamptz not null default now(),

  primary key (user_id, lesson_id),

  constraint user_lesson_progress_status_check
    check (
      status in (
        'not_started',
        'in_progress',
        'completed'
      )
    ),

  constraint user_lesson_progress_score_check
    check (
      score is null
      or score between 0 and 100
    )
);


create index user_lesson_progress_user_idx
  on public.user_lesson_progress (user_id);

create index user_lesson_progress_lesson_idx
  on public.user_lesson_progress (lesson_id);


-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

alter table public.lessons
  enable row level security;

alter table public.lesson_words
  enable row level security;

alter table public.user_lesson_progress
  enable row level security;


-- Logged-in users may read published lessons.

create policy "Authenticated users can read published lessons"
on public.lessons
for select
to authenticated
using (published = true);


-- Logged-in users may read vocabulary belonging to
-- published lessons.

create policy "Authenticated users can read published lesson words"
on public.lesson_words
for select
to authenticated
using (
  exists (
    select 1
    from public.lessons
    where lessons.id = lesson_words.lesson_id
      and lessons.published = true
  )
);


-- Users may only read their own lesson progress.

create policy "Users can read own lesson progress"
on public.user_lesson_progress
for select
to authenticated
using (
  auth.uid() = user_id
);


-- Users may only create progress for themselves.

create policy "Users can create own lesson progress"
on public.user_lesson_progress
for insert
to authenticated
with check (
  auth.uid() = user_id
);


-- Users may only update their own progress.

create policy "Users can update own lesson progress"
on public.user_lesson_progress
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


commit;