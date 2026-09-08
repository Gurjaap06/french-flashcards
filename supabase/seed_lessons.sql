-- ============================================================
-- STARTER LESSON CONTENT
--
-- Safe to rerun because lessons/words are upserted.
-- ============================================================


-- ============================================================
-- FRENCH LESSON 1 — GREETINGS
-- ============================================================

with french_lesson as (

  insert into public.lessons (
    language_code,
    slug,
    title,
    description,
    level,
    order_index,
    content,
    published
  )

  values (
    'fr',
    'greetings',
    'Greetings',
    'Learn basic French greetings and everyday expressions.',
    'A1',
    1,

    $$[
      {
        "type": "text",
        "title": "Greeting someone",
        "body": "Bonjour is the standard greeting used during the day."
      },
      {
        "type": "example",
        "target": "Bonjour !",
        "translation": "Hello!"
      },
      {
        "type": "text",
        "title": "Informal greetings",
        "body": "Salut is commonly used with friends and people you know well."
      },
      {
        "type": "example",
        "target": "Salut, ça va ?",
        "translation": "Hi, how are you?"
      },
      {
        "type": "text",
        "title": "Saying goodbye",
        "body": "Au revoir is the standard way to say goodbye."
      }
    ]$$::jsonb,

    true
  )

  on conflict (language_code, slug)

  do update set
    title = excluded.title,
    description = excluded.description,
    level = excluded.level,
    order_index = excluded.order_index,
    content = excluded.content,
    published = excluded.published

  returning id
)

insert into public.lesson_words (
  lesson_id,
  target_word,
  translation,
  example,
  category,
  gender,
  difficulty,
  position
)

select
  french_lesson.id,
  words.target_word,
  words.translation,
  words.example,
  'greetings',
  'none',
  1,
  words.position

from french_lesson

cross join (
  values
    (1, 'Bonjour', 'Hello', 'Bonjour !'),
    (2, 'Salut', 'Hi', 'Salut, ça va ?'),
    (3, 'Bonsoir', 'Good evening', 'Bonsoir, Madame.'),
    (4, 'Au revoir', 'Goodbye', 'Au revoir !'),
    (5, 'Merci', 'Thank you', 'Merci beaucoup.'),
    (6, 'S''il vous plaît', 'Please', 'Un café, s''il vous plaît.'),
    (7, 'Oui', 'Yes', 'Oui, merci.'),
    (8, 'Non', 'No', 'Non, merci.'),
    (9, 'Ça va ?', 'How are you?', 'Salut ! Ça va ?'),
    (10, 'Ça va bien.', 'I am doing well.', 'Ça va bien, merci.')
) as words (
  position,
  target_word,
  translation,
  example
)

on conflict (lesson_id, position)

do update set
  target_word = excluded.target_word,
  translation = excluded.translation,
  example = excluded.example,
  category = excluded.category,
  gender = excluded.gender,
  difficulty = excluded.difficulty;



-- ============================================================
-- GERMAN LESSON 1 — GREETINGS
-- ============================================================

with german_lesson as (

  insert into public.lessons (
    language_code,
    slug,
    title,
    description,
    level,
    order_index,
    content,
    published
  )

  values (
    'de',
    'greetings',
    'Greetings',
    'Learn basic German greetings and everyday expressions.',
    'A1',
    1,

    $$[
      {
        "type": "text",
        "title": "Greeting someone",
        "body": "Hallo is a common way to say hello in German."
      },
      {
        "type": "example",
        "target": "Hallo!",
        "translation": "Hello!"
      },
      {
        "type": "text",
        "title": "Greetings during the day",
        "body": "Guten Morgen, Guten Tag, and Guten Abend are used at different times of day."
      },
      {
        "type": "example",
        "target": "Guten Morgen!",
        "translation": "Good morning!"
      },
      {
        "type": "text",
        "title": "Saying goodbye",
        "body": "Tschüss is informal, while Auf Wiedersehen is more formal."
      }
    ]$$::jsonb,

    true
  )

  on conflict (language_code, slug)

  do update set
    title = excluded.title,
    description = excluded.description,
    level = excluded.level,
    order_index = excluded.order_index,
    content = excluded.content,
    published = excluded.published

  returning id
)

insert into public.lesson_words (
  lesson_id,
  target_word,
  translation,
  example,
  category,
  gender,
  difficulty,
  position
)

select
  german_lesson.id,
  words.target_word,
  words.translation,
  words.example,
  'greetings',
  'none',
  1,
  words.position

from german_lesson

cross join (
  values
    (1, 'Hallo', 'Hello', 'Hallo!'),
    (2, 'Guten Morgen', 'Good morning', 'Guten Morgen!'),
    (3, 'Guten Tag', 'Good day', 'Guten Tag!'),
    (4, 'Guten Abend', 'Good evening', 'Guten Abend!'),
    (5, 'Tschüss', 'Bye', 'Tschüss!'),
    (6, 'Auf Wiedersehen', 'Goodbye', 'Auf Wiedersehen!'),
    (7, 'Danke', 'Thank you', 'Danke!'),
    (8, 'Bitte', 'Please', 'Bitte schön.'),
    (9, 'Ja', 'Yes', 'Ja, danke.'),
    (10, 'Nein', 'No', 'Nein, danke.')
) as words (
  position,
  target_word,
  translation,
  example
)

on conflict (lesson_id, position)

do update set
  target_word = excluded.target_word,
  translation = excluded.translation,
  example = excluded.example,
  category = excluded.category,
  gender = excluded.gender,
  difficulty = excluded.difficulty;