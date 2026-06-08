# Sift

Chrome extension that detects AI-generated text and images on any webpage.

---

## What it does

AI-written content is everywhere — blog posts, comments, product descriptions, news articles. Sift scans pages as you browse and flags content that looks machine-generated, so you know what you're actually reading.

- Flags AI-written text with a confidence score and a breakdown of why
- Detects images sourced from AI generation platforms
- Two modes: label content in place, or filter it out entirely
- Sensitivity slider so you can tune how aggressive detection is
- Works on dynamic pages (Reddit, Twitter/X, infinite scroll)

No account required. No data leaves your browser.

---

## How detection works

The heuristic engine scores text based on a few things:

- **Phrase patterns** — LLMs reuse specific phrases constantly ("delve into", "it's worth noting", "in today's world", etc.). The engine checks for 30+ of these.
- **Sentence uniformity** — human writing varies in rhythm. AI output tends to have suspiciously consistent sentence lengths.
- **Transition word density** — AI loves starting sentences with "Furthermore," "Moreover," "Additionally,". High density is a red flag.
- **Contraction frequency** — formal AI text often avoids contractions even in casual contexts.

An optional API key enables a second-pass analysis on content that scores in the uncertain range.

---

## Install

1. Clone or download this repo
2. Go to `chrome://extensions` in Chrome
3. Enable Developer Mode
4. Load unpacked → select the project folder

---

## Stack

Chrome Extension Manifest V3, vanilla JS, no build step, no dependencies.

---

## Roadmap

- Right-click → check selected text
- Per-site detection history
- Firefox support
- Shareable page reports
