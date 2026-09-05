# Multi-language refactor

This version keeps your existing stack:

- Vite
- vanilla JavaScript
- Supabase
- `global_words`
- `user_flashcards`
- `learning_stats`
- `review_history`

It changes the vocabulary model from French-specific fields to generic fields.

## New vocabulary fields

- `language_code`
- `target_word`
- `translation`
- `normalized_target_word`
- `normalized_translation`
- `example`
- `category`
- `gender`
- `difficulty`

## Setup

1. Back up your Supabase data.
2. Run `supabase/multi_language_migration.sql` once.
3. Copy `.env.example` to `.env`.
4. Put your existing Supabase URL and anon key into `.env`.
5. Run:

```bash
npm install
npm run dev
```

## Test order

First test French:

- existing French cards appear
- global library appears
- search works
- add a French word
- favorite/remove cards
- both quiz directions work
- stats work

Then select German and add at least four test cards:

- Apfel → apple
- Haus → house
- Buch → book
- Wasser → water

Confirm German cards do not appear when French is selected and vice versa.

## Adding another language later

Add one new entry to `src/languages.js`, for example:

```js
es: {
  code: "es",
  name: "Spanish",
  flag: "🇪🇸",
  locale: "es-ES",
  wordLabel: "Spanish word",
  wordPlaceholder: "ex: manzana",
  examplePlaceholder: "ex: Como una manzana.",
  genders: [
    { value: "none", label: "none" },
    { value: "masculine", label: "masculine" },
    { value: "feminine", label: "feminine" },
  ],
},
```

The flashcard, global library, quiz, and stats code does not need a Spanish-specific rewrite.
