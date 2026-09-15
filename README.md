# BoliForge French Number Lab

A dependency-free, browser-based French number learning widget. It generates French numbers from 0 to 9,999, offers speech synthesis, an interactive number builder, and a listening quiz.

## Quick start

Copy these files into the same public folder in the parent website:

```text
french-data.js
french-rules.js
french-generator.js
audio.js
quiz.js
numbers.js
numbers.css
```

Use `numbers.html` as the complete standalone page, or copy its `<main>` content into an existing page. Include the stylesheet once in the page `<head>` and load the scripts at the end of the `<body>` in this exact order:

```html
<link rel="stylesheet" href="/path/to/numbers.css">

<script src="/path/to/french-data.js"></script>
<script src="/path/to/french-rules.js"></script>
<script src="/path/to/french-generator.js"></script>
<script src="/path/to/audio.js"></script>
<script src="/path/to/quiz.js"></script>
<script src="/path/to/numbers.js"></script>
```

The ordering matters: `french-generator.js` needs the data file, while the UI scripts use the generator and audio helper.

## Integrating into a larger site

The current CSS uses general selectors such as `body`, `main`, `select`, `table`, and `footer`. For a larger website, the safest approach is to place the lab in its own page. If it needs to live inside another page, wrap all lab markup in a container such as `.number-lab` and scope the rules in `numbers.css` before merging it with the parent stylesheet.

The JavaScript expects these element IDs from `numbers.html`:

```text
modeSelect, rangeSelect, audioToggle
numberGrid, numberCard
builderInput, builderResult
weirdSlider, weirdOutput
quizContainer, playQuizAudio, quizOptions, quizFeedback, nextQuestion
```

Keep the associated sections and IDs intact if the design is changed. The scripts initialize after `DOMContentLoaded`, so they can safely stay at the end of the page or use `defer` in the document head.

## Reusing the number generator

After loading `french-data.js` and `french-generator.js`, call the global `generateFrenchNumber` function:

```js
const result = generateFrenchNumber(2025);

console.log(result.written);  // "deux mille vingt-cinq"
console.log(result.english);  // "two thousand twenty-five"
console.log(result.literal);  // ""
```

The returned object has `value`, `written`, `ipa`, `english`, and `literal` properties. Inputs must be whole numbers from 0 to 9,999; invalid input returns `written: "Invalid"`.

To retrieve the teaching rule associated with a number, load `french-rules.js` and use:

```js
const rule = getPrimaryRule(71);
console.log(rule.title); // "71 keeps et"
```

## Audio

Audio uses the browser's built-in Web Speech API, so no audio files or API keys are needed. Use:

```js
speakFrench("quatre-vingt-un");
```

French voices depend on the visitor's device and browser. The app prefers a France French voice, then Canadian French, then any available French voice. The page remains usable when no French voice is installed.

## Customization notes

- Update brand text, headings, and lesson copy in `numbers.html`.
- Adjust the color variables at the top of `numbers.css` to match the parent site.
- The generator intentionally follows standard metropolitan French: `71` is `soixante-et-onze`, `80` is `quatre-vingts`, and `81` drops the final `s`.
- The quiz starts only after visitors choose **Listening Quiz** from the mode selector.

## Verification

Before deploying, open the integrated page in a browser and check the console for missing-file errors. At minimum, verify a grid selection, number builder output, quiz mode, and the audio button on the intended target browser.
