-- IMPORTANT:
-- Back up your Supabase data before running this.
-- This migration assumes your CURRENT schema still has:
-- french, english, normalized_french, normalized_english
-- in public.global_words.
--
-- Run this ONCE in Supabase SQL Editor before using the new frontend.

begin;

-- 1. Rename French-specific vocabulary columns.
alter table public.global_words
  rename column french to target_word;

alter table public.global_words
  rename column english to translation;

alter table public.global_words
  rename column normalized_french to normalized_target_word;

alter table public.global_words
  rename column normalized_english to normalized_translation;

-- 2. Existing rows are French, so mark them as French automatically.
alter table public.global_words
  add column language_code text not null default 'fr';

-- 3. Validate language codes such as fr, de, es, it.
alter table public.global_words
  add constraint global_words_language_code_check
  check (language_code ~ '^[a-z]{2,3}$');

-- 4. Remove the old uniqueness rule that ignored language_code.
-- This finds unique constraints containing both normalized vocabulary fields.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.global_words'::regclass
      and c.contype = 'u'
      and pg_get_constraintdef(c.oid) ilike '%normalized_target_word%'
      and pg_get_constraintdef(c.oid) ilike '%normalized_translation%'
      and pg_get_constraintdef(c.oid) not ilike '%language_code%'
  loop
    execute format(
      'alter table public.global_words drop constraint %I',
      constraint_name
    );
  end loop;
end $$;

-- Also remove any standalone old unique index using those two fields.
do $$
declare
  index_name text;
begin
  for index_name in
    select indexname
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'global_words'
      and indexdef ilike 'create unique index%'
      and indexdef ilike '%normalized_target_word%'
      and indexdef ilike '%normalized_translation%'
      and indexdef not ilike '%language_code%'
  loop
    execute format(
      'drop index if exists public.%I',
      index_name
    );
  end loop;
end $$;

-- 5. The same spelling/translation can now exist in different languages,
-- but duplicates inside one language are blocked.
create unique index global_words_language_word_translation_unique
  on public.global_words (
    language_code,
    normalized_target_word,
    normalized_translation
  );

create index global_words_language_code_idx
  on public.global_words (language_code);

-- 6. German adds "neuter".
-- Remove an old gender CHECK constraint if your French-only schema had one.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.global_words'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%gender%'
  loop
    execute format(
      'alter table public.global_words drop constraint %I',
      constraint_name
    );
  end loop;
end $$;

alter table public.global_words
  add constraint global_words_gender_check
  check (
    gender is null
    or gender in (
      'none',
      'masculine',
      'feminine',
      'neuter',
      'both',
      'common',
      'plural',
      'other'
    )
  );

-- 7. Make review_history.direction generic.
-- Old examples: fr-en, en-fr
-- New examples also include: de-en, en-de
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.review_history'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%direction%'
  loop
    execute format(
      'alter table public.review_history drop constraint %I',
      constraint_name
    );
  end loop;
end $$;

alter table public.review_history
  add constraint review_history_direction_check
  check (direction ~ '^[a-z]{2,3}-[a-z]{2,3}$');

commit;
