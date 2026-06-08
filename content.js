// AIRadar Content Script
// Scans page content, labels AI-generated text and images

(function () {
  'use strict';

  let settings = { enabled: true, mode: 'label', threshold: 40, scanImages: true, apiKey: '' };
  let stats = { flagged: 0, scanned: 0, aiImages: 0 };
  const processed = new WeakSet();

  // ─── Boot ─────────────────────────────────────────────────────────────────
  chrome.storage.sync.get(['settings'], ({ settings: saved }) => {
    if (saved) settings = { ...settings, ...saved };
    if (!settings.enabled) return;
    injectStyles();
    scanPage();

    // Re-scan on dynamic content (SPAs, infinite scroll)
    const observer = new MutationObserver(debounce(scanPage, 800));
    observer.observe(document.body, { childList: true, subtree: true });
  });

  // ─── Main scan ────────────────────────────────────────────────────────────
  function scanPage() {
    scanTextBlocks();
    if (settings.scanImages) scanImages();
  }

  // ─── Text scanning ─────────────────────────────────────────────────────────
  const TEXT_SELECTORS = [
    'article', 'p', '[class*="post-content"]', '[class*="article-body"]',
    '[class*="entry-content"]', '[class*="story-body"]', '[class*="blog-post"]',
    '[data-testid="tweetText"]',           // Twitter/X
    '[data-click-id="text"]',              // Reddit
    '.comment-body', '.comment-content',   // Generic comments
    'h1', 'h2',                            // Headlines can be AI too
  ];

  function scanTextBlocks() {
    TEXT_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (processed.has(el)) return;
        processed.add(el);

        const text = el.innerText?.trim() || '';
        if (text.length < 80) return;

        stats.scanned++;
        const { score, signals, matched } = AIHeuristics.analyze(text);

        if (score >= settings.threshold) {
          stats.flagged++;
          applyTextAction(el, score, signals, matched);
          reportStats();
        }
      });
    });
  }

  function applyTextAction(el, score, signals, matched) {
    const { verdict, color, emoji } = AIHeuristics.label(score);

    if (settings.mode === 'hide') {
      el.style.setProperty('display', 'none', 'important');
      el.dataset.airHidden = '1';
      return;
    }

    // 'label' mode — add a badge above the element
    if (el.dataset.airLabeled) return;
    el.dataset.airLabeled = '1';

    const badge = document.createElement('div');
    badge.className = 'air-badge';
    badge.innerHTML = `
      <span class="air-emoji">${emoji}</span>
      <span class="air-verdict" style="color:${color}">${verdict}</span>
      <span class="air-score">${score}% AI score</span>
      <span class="air-toggle">▼ details</span>
      <div class="air-details hidden">
        ${signals.map(s => `<div class="air-signal">• ${s}</div>`).join('')}
        ${matched.length ? `<div class="air-phrases">Phrases: <em>${matched.slice(0,3).join(', ')}</em></div>` : ''}
      </div>
    `;

    badge.querySelector('.air-toggle').addEventListener('click', () => {
      const details = badge.querySelector('.air-details');
      const toggle = badge.querySelector('.air-toggle');
      details.classList.toggle('hidden');
      toggle.textContent = details.classList.contains('hidden') ? '▼ details' : '▲ hide';
    });

    el.parentNode?.insertBefore(badge, el);
  }

  // ─── Image scanning ───────────────────────────────────────────────────────
  // Known AI image generation domains / CDNs
  const AI_IMAGE_DOMAINS = [
    'oaidalleapiprodscus.blob.core.windows.net', // DALL-E
    'cdn.midjourney.com', 'midjourney.com',
    'image.cdn2.seaart.ai', 'seaart.ai',
    'images.nightcafe.studio',
    'cdn.leonardo.ai', 'leonardo.ai',
    'dreamstudio.ai', 'stability.ai',
    'replicate.delivery',
    'getimg.ai',
    'stablecog.com',
  ];

  // Common AI image URL patterns
  const AI_IMAGE_PATTERNS = [
    /dall[-_]?e/i, /midjourney/i, /stable[-_]?diffusion/i,
    /ai[-_]?generated/i, /generated[-_]?by[-_]?ai/i,
    /\/ai\//i, /artifically/i,
  ];

  function scanImages() {
    document.querySelectorAll('img').forEach(img => {
      if (processed.has(img)) return;
      processed.add(img);

      const src = img.src || img.dataset.src || '';
      const alt = img.alt || '';
      const title = img.title || '';

      const isAiDomain = AI_IMAGE_DOMAINS.some(d => src.includes(d));
      const isAiPattern = AI_IMAGE_PATTERNS.some(p => p.test(src) || p.test(alt) || p.test(title));

      // Check for C2PA / AI metadata marker in alt text
      const hasAiMetaTag = alt.toLowerCase().includes('ai') || title.toLowerCase().includes('ai generated');

      if (isAiDomain || isAiPattern || hasAiMetaTag) {
        stats.aiImages++;
        flagImage(img);
        reportStats();
      }
    });
  }

  function flagImage(img) {
    const wrapper = document.createElement('div');
    wrapper.className = 'air-image-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';

    const tag = document.createElement('div');
    tag.className = 'air-image-tag';
    tag.textContent = 'AI Generated';

    img.parentNode?.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    wrapper.appendChild(tag);
  }

  // ─── Styles ───────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('air-styles')) return;
    const style = document.createElement('style');
    style.id = 'air-styles';
    style.textContent = `
      .air-badge {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        background: #13151a;
        border: 1px solid #1e2128;
        border-left: 2px solid #1d4ed8;
        border-radius: 6px;
        padding: 7px 12px;
        margin: 8px 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 12px;
        color: #9ca3af;
        z-index: 9999;
        position: relative;
      }
      .air-emoji { display: none; }
      .air-verdict { font-weight: 600; font-size: 12px; }
      .air-score { color: #6666aa; font-size: 11px; }
      .air-toggle {
        cursor: pointer;
        color: #7c3aed;
        font-size: 11px;
        margin-left: auto;
        user-select: none;
      }
      .air-toggle:hover { text-decoration: underline; }
      .air-details {
        width: 100%;
        margin-top: 4px;
        padding-top: 6px;
        border-top: 1px solid #2a2a3e;
        font-size: 11px;
        color: #9999cc;
      }
      .air-details.hidden { display: none; }
      .air-signal { margin-bottom: 2px; }
      .air-phrases { margin-top: 4px; color: #7777bb; }
      .air-phrases em { color: #a78bfa; }
      .air-image-wrapper { position: relative !important; display: inline-block !important; }
      .air-image-tag {
        position: absolute;
        top: 8px; left: 8px;
        background: rgba(17,19,24,0.88);
        color: #e2e4e9;
        font-size: 11px;
        font-weight: 500;
        padding: 3px 8px;
        border-radius: 4px;
        border: 1px solid #1d4ed8;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        z-index: 9999;
        pointer-events: none;
        letter-spacing: 0.2px;
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function reportStats() {
    chrome.runtime.sendMessage({ type: 'UPDATE_STATS', stats }).catch(() => {});
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    if (msg.type === 'GET_PAGE_STATS') sendResponse(stats);
    if (msg.type === 'RESCAN') { processed.forEach(() => {}); scanPage(); }
  });

})();
