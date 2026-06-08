# 📡 AIRadar — AI Content Detector

> A Chrome extension that detects and labels AI-generated text and images on any webpage. Know what's real.

![Version](https://img.shields.io/badge/version-1.0.0-purple)
![Manifest](https://img.shields.io/badge/Manifest-V3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## The Problem

The internet is filling up with AI-generated articles, AI spam comments, and AI-made images — and it's getting harder to tell what's real. AIRadar puts a label on it.

## Features

- 🤖 **AI Text Detection** — scans articles, comments, and posts for AI-generated writing patterns
- 🖼 **AI Image Detection** — flags images from known AI generation platforms (DALL-E, Midjourney, Stable Diffusion, etc.)
- 🏷 **Label Mode** — adds a badge with confidence score and explanation
- 🚫 **Hide Mode** — removes AI content from the page entirely
- 🎚 **Sensitivity Slider** — tune detection from aggressive to strict
- 🔄 **Live Rescan** — re-run detection after page updates (SPAs, infinite scroll)
- 📊 **Stats Dashboard** — see how much AI content you encounter

## How Detection Works

### Heuristic Engine (No API Key Required)
- Detects **30+ AI signature phrases** (e.g. "delve into", "it's worth noting", "as an AI")
- Analyzes **sentence structure burstiness** — AI writes in uniform lengths, humans don't
- Flags **excessive transition words** (Furthermore, Moreover, Additionally...)
- Detects **em-dash overuse** and **lack of contractions** — common in LLM output
- Checks image **src URLs and alt text** against known AI platform domains

### Claude API (Optional — Deeper Analysis)
- When an API key is provided, sends uncertain content to Claude for a second opinion
- Catches subtler AI writing that passes heuristic checks

## Installation

1. Clone this repo:
   ```bash
   git clone https://github.com/samueldgs1/ai-content-detector.git
   ```
2. Go to `chrome://extensions` in Chrome
3. Enable **Developer Mode**
4. Click **Load unpacked** → select the project folder

## Project Structure

```
ai-content-detector/
├── manifest.json      # Extension config (Manifest V3)
├── heuristics.js      # AI text pattern detection engine
├── content.js         # Page scanner — labels/hides AI content
├── background.js      # Stats tracking, badge counter
├── popup.html/css/js  # Dashboard UI
├── options.html/js    # Settings page
└── icons/             # Extension icons
```

## Tech Stack

- Chrome Extension **Manifest V3**
- **MutationObserver** for dynamic content (SPAs, infinite scroll)
- **Heuristic NLP** — no ML model needed, pure pattern analysis
- **Claude API** (optional) for deeper classification
- Vanilla JS — zero dependencies

## Roadmap

- [ ] ML-based perplexity scoring (detect AI by how "predictable" text is)
- [ ] Right-click → "Check this text" context menu
- [ ] Export report of AI content found on a page
- [ ] Firefox support
- [ ] Community-sourced phrase list updates

---

MIT © 2026
