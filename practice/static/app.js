/**
 * Lit Passage Practice — static client-side app.
 *
 * Fetches public-domain classics from Project Gutenberg and runs a
 * lightweight rubric check on the user's analysis. Falls back to bundled
 * passages if live fetching fails.
 */

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const BOOKS = [
  { id: 1342, title: "Pride and Prejudice", author: "Jane Austen" },
  { id: 158, title: "Emma", author: "Jane Austen" },
  { id: 161, title: "Sense and Sensibility", author: "Jane Austen" },
  { id: 105, title: "Persuasion", author: "Jane Austen" },
  { id: 1260, title: "Jane Eyre", author: "Charlotte Brontë" },
  { id: 768, title: "Wuthering Heights", author: "Emily Brontë" },
  { id: 1400, title: "Great Expectations", author: "Charles Dickens" },
  { id: 98, title: "A Tale of Two Cities", author: "Charles Dickens" },
  { id: 46, title: "A Christmas Carol", author: "Charles Dickens" },
  { id: 2701, title: "Moby-Dick", author: "Herman Melville" },
  { id: 74, title: "The Adventures of Tom Sawyer", author: "Mark Twain" },
  { id: 76, title: "The Adventures of Huckleberry Finn", author: "Mark Twain" },
  { id: 11, title: "Alice's Adventures in Wonderland", author: "Lewis Carroll" },
  { id: 1524, title: "Hamlet", author: "William Shakespeare" },
  { id: 1533, title: "Macbeth", author: "William Shakespeare" },
  { id: 1513, title: "Romeo and Juliet", author: "William Shakespeare" },
  { id: 1514, title: "A Midsummer Night's Dream", author: "William Shakespeare" },
  { id: 844, title: "The Importance of Being Earnest", author: "Oscar Wilde" },
  { id: 174, title: "The Picture of Dorian Gray", author: "Oscar Wilde" },
  { id: 84, title: "Frankenstein", author: "Mary Shelley" },
  { id: 345, title: "Dracula", author: "Bram Stoker" },
  { id: 42, title: "The Strange Case of Dr Jekyll and Mr Hyde", author: "Robert Louis Stevenson" },
  { id: 120, title: "Treasure Island", author: "Robert Louis Stevenson" },
  { id: 219, title: "Heart of Darkness", author: "Joseph Conrad" },
  { id: 55, title: "The Wonderful Wizard of Oz", author: "L. Frank Baum" },
  { id: 521, title: "Robinson Crusoe", author: "Daniel Defoe" },
  { id: 829, title: "Gulliver's Travels", author: "Jonathan Swift" },
  { id: 33, title: "The Scarlet Letter", author: "Nathaniel Hawthorne" },
  { id: 209, title: "The Turn of the Screw", author: "Henry James" },
  { id: 160, title: "The Awakening", author: "Kate Chopin" },
  { id: 1952, title: "The Yellow Wallpaper", author: "Charlotte Perkins Gilman" },
  { id: 4517, title: "Ethan Frome", author: "Edith Wharton" },
  { id: 541, title: "The Age of Innocence", author: "Edith Wharton" },
  { id: 284, title: "The House of Mirth", author: "Edith Wharton" },
  { id: 2600, title: "War and Peace", author: "Leo Tolstoy" },
  { id: 1399, title: "Anna Karenina", author: "Leo Tolstoy" },
  { id: 2554, title: "Crime and Punishment", author: "Fyodor Dostoevsky" },
  { id: 28054, title: "The Brothers Karamazov", author: "Fyodor Dostoevsky" },
  { id: 135, title: "Les Misérables", author: "Victor Hugo" },
  { id: 1184, title: "The Count of Monte Cristo", author: "Alexandre Dumas" },
  { id: 1257, title: "The Three Musketeers", author: "Alexandre Dumas" },
  { id: 103, title: "Around the World in Eighty Days", author: "Jules Verne" },
  { id: 164, title: "Twenty Thousand Leagues under the Sea", author: "Jules Verne" },
  { id: 36, title: "The War of the Worlds", author: "H. G. Wells" },
  { id: 35, title: "The Time Machine", author: "H. G. Wells" },
  { id: 236, title: "The Jungle Book", author: "Rudyard Kipling" },
  { id: 215, title: "The Call of the Wild", author: "Jack London" },
  { id: 37106, title: "Little Women", author: "Louisa May Alcott" },
  { id: 17396, title: "The Secret Garden", author: "Frances Hodgson Burnett" },
  { id: 289, title: "The Wind in the Willows", author: "Kenneth Grahame" },
  { id: 16, title: "Peter Pan", author: "J. M. Barrie" },
  { id: 271, title: "Black Beauty", author: "Anna Sewell" },
  { id: 82, title: "Ivanhoe", author: "Walter Scott" },
  { id: 2765, title: "The Last of the Mohicans", author: "James Fenimore Cooper" },
  { id: 60, title: "The Scarlet Pimpernel", author: "Baroness Orczy" },
  { id: 1695, title: "The Man Who Was Thursday", author: "G. K. Chesterton" },
  { id: 2413, title: "Madame Bovary", author: "Gustave Flaubert" },
  { id: 1727, title: "The Odyssey", author: "Homer (Samuel Butler translation)" },
  { id: 6130, title: "The Iliad", author: "Homer (Samuel Butler translation)" },
  { id: 2383, title: "The Canterbury Tales", author: "Geoffrey Chaucer" },
  { id: 2000, title: "Don Quixote", author: "Miguel de Cervantes (Ormsby translation)" },
  { id: 15492, title: "A Doll's House", author: "Henrik Ibsen" },
  { id: 2500, title: "Siddhartha", author: "Hermann Hesse" },
];

let FALLBACK_PASSAGES = [];

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

const START_RE = /\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*?\*\*\*/is;
const END_RE = /\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*?\*\*\*/is;

function countWords(text) {
  const matches = String(text ?? "").match(/\b\w+\b/g);
  return matches ? matches.length : 0;
}

function stripGutenbergBoilerplate(text) {
  const start = START_RE.exec(text);
  if (start) {
    text = text.slice(start.index + start[0].length);
  }
  const end = END_RE.exec(text);
  if (end) {
    text = text.slice(0, end.index);
  }
  return text.trim();
}

function cleanParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim().replace(/\s+/g, " "))
    .filter((p) => p.length > 0);
}

function sentencesFromParagraph(p) {
  return p
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function sample(array) {
  return array[randomInt(array.length)];
}

function extractPassage(text, minWords = 100, maxWords = 200) {
  const body = stripGutenbergBoilerplate(text);
  if (!body) return null;

  const paragraphs = cleanParagraphs(body);
  const candidates = [];

  // 1. Whole paragraphs that already fit the range.
  for (const p of paragraphs) {
    const wc = countWords(p);
    if (minWords <= wc && wc <= maxWords) {
      candidates.push(p);
    }
  }

  // 2. Merge a few short consecutive paragraphs.
  for (let i = 0; i < paragraphs.length; i++) {
    const merged = [];
    let wc = 0;
    for (let j = i; j < Math.min(i + 6, paragraphs.length); j++) {
      merged.push(paragraphs[j]);
      wc += countWords(paragraphs[j]);
      if (minWords <= wc && wc <= maxWords) {
        candidates.push(merged.join(" "));
        break;
      } else if (wc > maxWords) {
        break;
      }
    }
  }

  // 3. Sentence-window from a paragraph that is too long.
  for (const p of paragraphs) {
    if (countWords(p) > maxWords) {
      const sentences = sentencesFromParagraph(p);
      for (let start = 0; start < sentences.length; start++) {
        const chunk = [];
        let wc = 0;
        for (const s of sentences.slice(start)) {
          chunk.push(s);
          wc += countWords(s);
          if (minWords <= wc && wc <= maxWords) {
            candidates.push(chunk.join(" "));
            break;
          } else if (wc > maxWords) {
            break;
          }
        }
      }
    }
  }

  if (candidates.length > 0) {
    return sample(candidates);
  }

  // Final fallback: grab a random word window and trim to a sentence end.
  const words = body.match(/\S+/g) || [];
  if (words.length < minWords) return null;

  const maxStart = Math.max(0, words.length - maxWords - 1);
  const start = randomInt(maxStart + 1);
  const window = words.slice(start, start + maxWords);
  let joined = window.join(" ");

  const ends = [". ", "! ", "? "]
    .map((mark) => joined.lastIndexOf(mark))
    .filter((idx) => idx !== -1);
  const lastSentenceEnd = ends.length ? Math.max(...ends) : -1;

  if (lastSentenceEnd > joined.length / 2) {
    joined = joined.slice(0, lastSentenceEnd + 1);
  }

  const finalWc = countWords(joined);
  if (minWords <= finalWc && finalWc <= maxWords) {
    return joined;
  }
  return window.slice(0, Math.min(maxWords, window.length)).join(" ");
}

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

const TEXT_CACHE = {};

async function fetchBookText(bookId, signal) {
  if (TEXT_CACHE[bookId] !== undefined) {
    return TEXT_CACHE[bookId];
  }

  const urls = [
    `https://www.gutenberg.org/ebooks/${bookId}.txt.utf-8`,
    `https://www.gutenberg.org/files/${bookId}/${bookId}-0.txt`,
  ];

  for (const url of urls) {
    const controller = new AbortController();
    const perUrlTimeoutId = setTimeout(() => controller.abort(), 3000);

    let outerAbortHandler;
    if (signal) {
      outerAbortHandler = () => controller.abort();
      signal.addEventListener("abort", outerAbortHandler, { once: true });
    }

    try {
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(perUrlTimeoutId);
      if (signal && outerAbortHandler) {
        signal.removeEventListener("abort", outerAbortHandler);
      }
      if (!resp.ok) continue;
      const text = await resp.text();
      if (text.length < 500) continue;
      TEXT_CACHE[bookId] = text;
      return text;
    } catch (err) {
      clearTimeout(perUrlTimeoutId);
      if (signal && outerAbortHandler) {
        signal.removeEventListener("abort", outerAbortHandler);
      }
      if (signal && signal.aborted) {
        // Outer budget exhausted; stop trying this book.
        return null;
      }
      // Otherwise this was a per-URL timeout or network error; try next URL.
    }
  }

  return null;
}

function isValidPassage(p) {
  return (
    p &&
    typeof p.title === "string" &&
    typeof p.author === "string" &&
    typeof p.passage === "string"
  );
}

async function loadFallbackPassages() {
  if (FALLBACK_PASSAGES.length > 0) return;

  // When served over HTTP, prefer the external JSON file so it can be updated
  // without editing the HTML. When opened from the filesystem (file://), fetch()
  // is blocked in some browsers, so fall back to the inline script block.
  const isFileProtocol = window.location.protocol === "file:";

  if (!isFileProtocol) {
    try {
      const resp = await fetch("static/passages.json");
      if (resp.ok) {
        const parsed = await resp.json();
        if (Array.isArray(parsed)) {
          FALLBACK_PASSAGES = parsed.filter(isValidPassage);
          if (FALLBACK_PASSAGES.length > 0) return;
        }
      }
    } catch (err) {
      console.error("Failed to fetch fallback passages", err);
    }
  }

  const inline = document.getElementById("fallback-passages");
  if (inline) {
    try {
      const parsed = JSON.parse(inline.textContent);
      if (Array.isArray(parsed) && parsed.length > 0) {
        FALLBACK_PASSAGES = parsed.filter(isValidPassage);
        if (FALLBACK_PASSAGES.length > 0) return;
      }
    } catch (err) {
      console.error("Failed to parse inline fallback passages", err);
    }
  }

  FALLBACK_PASSAGES = [];
}

async function getRandomPassage(signal) {
  await loadFallbackPassages();

  const budgetController = new AbortController();
  if (signal) {
    signal.addEventListener("abort", () => budgetController.abort(), { once: true });
  }
  const budgetTimeoutId = setTimeout(() => budgetController.abort(), 6000);
  const attempted = new Set();

  for (let attempt = 0; attempt < Math.min(10, BOOKS.length); attempt++) {
    if (budgetController.signal.aborted) break;

    const remaining = BOOKS.filter((b) => !attempted.has(b.id));
    if (remaining.length === 0) break;

    const book = sample(remaining);
    attempted.add(book.id);

    const text = await fetchBookText(book.id, budgetController.signal);
    if (!text) continue;

    const passage = extractPassage(text);
    if (passage) {
      clearTimeout(budgetTimeoutId);
      return {
        id: book.id,
        title: book.title,
        author: book.author,
        source_url: `https://www.gutenberg.org/ebooks/${book.id}`,
        passage,
        word_count: countWords(passage),
        fallback: false,
      };
    }
  }

  clearTimeout(budgetTimeoutId);

  // Fallback
  if (FALLBACK_PASSAGES.length === 0) {
    return null;
  }
  const fb = sample(FALLBACK_PASSAGES);
  return {
    id: null,
    title: fb.title,
    author: fb.author,
    source_url: "https://www.gutenberg.org/",
    passage: fb.passage,
    word_count: countWords(fb.passage),
    fallback: true,
  };
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

function evaluateFeedback(passage, response) {
  const responseLower = response.toLowerCase();
  const wc = countWords(response);

  const checks = {
    length: {
      label: "Response is at least 50 words",
      passed: wc >= 50,
    },
    text_reference: {
      label: "Refers to specific evidence from the passage",
      passed: /["']|\b(?:line|passage|text|says|describes|shows|suggests|quotes|writes|states)\b/.test(responseLower),
    },
    device_or_theme: {
      label: "Mentions a literary device, tone, or theme",
      passed: /\b(?:metaphor|simile|imagery|symbol|theme|tone|irony|personification|foreshadowing|conflict|mood|diction|syntax|character|setting|narrator|perspective|point of view|alliteration)\b/.test(responseLower),
    },
    explanation: {
      label: "Explains how the evidence supports an interpretation",
      passed: /\b(?:because|shows|suggests|indicates|demonstrates|reveals|implies|creates|emphasizes|highlights|conveys|illustrates|represents|reflects|therefore|thus)\b/.test(responseLower),
    },
  };

  const passed = Object.values(checks).filter((c) => c.passed).length;
  const total = Object.keys(checks).length;

  let rating;
  if (passed === total) rating = "Strong";
  else if (passed >= total / 2) rating = "Good";
  else rating = "Developing";

  const missing = Object.values(checks)
    .filter((c) => !c.passed)
    .map((c) => c.label);

  const suggestions = [];
  if (!checks.length.passed) {
    suggestions.push("Try writing a bit more—aim for at least 50 words so you can develop your ideas.");
  }
  if (!checks.text_reference.passed) {
    suggestions.push("Quote or paraphrase a specific line from the passage to ground your analysis.");
  }
  if (!checks.device_or_theme.passed) {
    suggestions.push("Identify a literary device, tone, or theme the author is using.");
  }
  if (!checks.explanation.passed) {
    suggestions.push("Explain why the evidence matters—what does it show about meaning or effect?");
  }
  if (suggestions.length === 0) {
    suggestions.push("Great job! Your analysis covers the key elements of a strong response.");
  }

  return {
    response_word_count: wc,
    checks,
    passed,
    total,
    rating,
    missing,
    suggestions,
    generated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

const els = {
  passageTitle: document.getElementById("passage-title"),
  passageBox: document.getElementById("passage-box"),
  passageAuthor: document.getElementById("passage-author"),
  passageWordCount: document.getElementById("passage-word-count"),
  sourceLink: document.getElementById("source-link"),
  newPassageBtn: document.getElementById("new-passage-btn"),
  responseInput: document.getElementById("response-input"),
  responseWordCount: document.getElementById("response-word-count"),
  submitWarning: document.getElementById("submit-warning"),
  submitBtn: document.getElementById("submit-btn"),
  exportBtn: document.getElementById("export-btn"),
  exportFormat: document.getElementById("export-format"),
  feedbackCard: document.getElementById("feedback-card"),
  scoreRing: document.getElementById("score-ring"),
  scoreValue: document.getElementById("score-value"),
  rating: document.getElementById("rating"),
  checklist: document.getElementById("checklist"),
  suggestions: document.getElementById("suggestions"),
};

let currentPassage = null;
let currentFeedback = null;
let currentResponse = "";
let currentLoadId = 0;
let activeLoadController = null;
let renderPassageTimeout = null;

const SHIMMER_HTML = '<div class="shimmer" id="passage-shimmer"><span></span><span></span><span></span><span></span></div>';

function setLoading(isLoading) {
  els.newPassageBtn.disabled = isLoading;
  els.submitBtn.disabled = isLoading;
  if (isLoading) {
    els.passageBox.style.opacity = "1";
    els.passageBox.classList.add("is-loading");
    els.passageBox.innerHTML = SHIMMER_HTML;
  } else {
    els.passageBox.classList.remove("is-loading");
  }
}

function renderPassage(data) {
  if (renderPassageTimeout) {
    clearTimeout(renderPassageTimeout);
    renderPassageTimeout = null;
  }

  if (!data) {
    currentPassage = null;
    els.passageTitle.textContent = "Couldn't load a passage";
    els.passageBox.style.opacity = "1";
    els.passageBox.textContent = "Please check your internet connection and try again.";
    els.passageAuthor.textContent = "—";
    els.passageWordCount.textContent = "— words";
    els.sourceLink.href = "https://www.gutenberg.org/";
    return;
  }

  currentPassage = data;
  els.passageBox.style.opacity = '0';
  renderPassageTimeout = setTimeout(() => {
    renderPassageTimeout = null;
    els.passageTitle.textContent = data.title;
    els.passageBox.textContent = data.passage;
    els.passageAuthor.textContent = data.author;
    els.passageWordCount.textContent = `${data.word_count} words`;
    els.sourceLink.href = data.source_url;
    els.passageBox.style.opacity = '1';
  }, 150);
}

function renderFeedback(result) {
  currentFeedback = result;
  els.feedbackCard.classList.remove("hidden");
  els.scoreValue.textContent = `${result.passed}/${result.total}`;
  els.rating.textContent = result.rating;

  const angle = (result.passed / result.total) * 360;
  els.scoreRing.style.setProperty("--score-angle", `${angle}deg`);

  els.feedbackCard.style.borderTopColor = result.rating === "Strong"
    ? "var(--success)"
    : result.rating === "Good"
      ? "var(--warning)"
      : "var(--danger)";

  els.checklist.innerHTML = "";
  let delay = 0;
  for (const check of Object.values(result.checks)) {
    const li = document.createElement("li");
    li.className = check.passed ? "pass" : "fail";
    li.style.animationDelay = `${delay}ms`;

    const iconSpan = document.createElement("span");
    iconSpan.className = "check-icon";
    iconSpan.setAttribute("aria-hidden", "true");
    iconSpan.textContent = check.passed ? "✓" : "!";

    const labelSpan = document.createElement("span");
    labelSpan.className = "check-label";
    labelSpan.textContent = check.label;

    li.appendChild(iconSpan);
    li.appendChild(labelSpan);
    els.checklist.appendChild(li);
    delay += 80;
  }

  const ul = els.suggestions.querySelector("ul");
  ul.innerHTML = "";
  for (const suggestion of result.suggestions) {
    const li = document.createElement("li");
    li.textContent = suggestion;
    ul.appendChild(li);
  }

  els.feedbackCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function exportMarkdown() {
  if (!currentPassage) return;
  const lines = [
    `# ${currentPassage.title}`,
    "",
    `**Author:** ${currentPassage.author}`,
    `**Source:** ${currentPassage.source_url}`,
    `**Word count:** ${currentPassage.word_count}`,
    "",
    "> " + currentPassage.passage.replace(/\n/g, "\n> "),
    "",
    "## Analysis",
    "",
    (currentFeedback ? currentResponse : els.responseInput.value.trim()) || "(No analysis submitted)",
  ];

  if (currentFeedback) {
    lines.push(
      "",
      "## Feedback",
      "",
      `**Rating:** ${currentFeedback.rating} (${currentFeedback.passed}/${currentFeedback.total})`,
      "",
      "### Checks",
      "",
      ...Object.values(currentFeedback.checks).map((c) => `- [${c.passed ? "x" : " "}] ${c.label}`),
      "",
      "### Suggestions",
      "",
      ...currentFeedback.suggestions.map((s) => `- ${s}`),
      "",
      `_Exported at ${currentFeedback.generated_at}_`
    );
  } else {
    lines.push("", "_No feedback submitted yet._");
  }

  downloadBlob(`${currentPassage.title.replace(/\s+/g, "_")}_analysis.md`, lines.join("\n"), "text/markdown");
}

function exportJson() {
  if (!currentPassage) return;
  const payload = {
    passage: currentPassage,
    response: currentFeedback ? currentResponse : els.responseInput.value.trim(),
  };
  if (currentFeedback) {
    payload.feedback = currentFeedback;
  }
  downloadBlob(`${currentPassage.title.replace(/\s+/g, "_")}_analysis.json`, JSON.stringify(payload, null, 2), "application/json");
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

async function loadNewPassage() {
  currentLoadId += 1;
  const loadId = currentLoadId;

  if (activeLoadController) {
    activeLoadController.abort();
  }
  activeLoadController = new AbortController();
  const loadSignal = activeLoadController.signal;

  setLoading(true);
  els.feedbackCard.classList.add("hidden");
  els.submitWarning.classList.add("hidden");
  els.responseInput.value = "";
  els.responseWordCount.textContent = "0 words";
  currentFeedback = null;
  currentResponse = "";

  try {
    const data = await getRandomPassage(loadSignal);
    if (loadId !== currentLoadId) return;
    renderPassage(data);
  } catch (err) {
    if (err.name === "AbortError") return;
    console.error("Failed to load passage", err);
    if (loadId !== currentLoadId) return;
    renderPassage(null);
  } finally {
    if (loadId === currentLoadId) {
      setLoading(false);
      activeLoadController = null;
    }
  }
}

function handleSubmit() {
  if (!currentPassage) {
    alert("Please load a passage first.");
    return;
  }
  const response = els.responseInput.value.trim();
  if (!response) {
    els.submitWarning.classList.remove("hidden");
    els.responseInput.focus();
    return;
  }
  els.submitWarning.classList.add("hidden");

  const originalText = els.submitBtn.innerHTML;
  els.submitBtn.disabled = true;
  els.submitBtn.innerHTML = '<span class="btn-icon" aria-hidden="true">⟳</span> Analyzing…';

  try {
    const result = evaluateFeedback(currentPassage.passage, response);
    currentResponse = response;
    renderFeedback(result);
  } finally {
    els.submitBtn.disabled = false;
    els.submitBtn.innerHTML = originalText;
  }
}

function handleExport() {
  if (!currentPassage) {
    alert("No passage to export. Load a passage first.");
    return;
  }
  const format = els.exportFormat.value;
  try {
    if (format === "markdown") {
      exportMarkdown();
    } else {
      exportJson();
    }
  } catch (err) {
    console.error("Export failed", err);
    alert("Could not export your response. Please try again.");
  }
}

function init() {
  els.newPassageBtn.addEventListener("click", loadNewPassage);
  els.submitBtn.addEventListener("click", handleSubmit);
  els.exportBtn.addEventListener("click", handleExport);

  els.responseInput.addEventListener("input", () => {
    els.submitWarning.classList.add("hidden");
    const wc = countWords(els.responseInput.value);
    els.responseWordCount.textContent = `${wc} word${wc === 1 ? "" : "s"}`;
  });

  loadNewPassage();
}

init();
