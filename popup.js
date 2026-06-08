const masterToggle = document.getElementById('master-toggle');
const toggleImages = document.getElementById('toggle-images');
const thresholdSlider = document.getElementById('threshold');
const thresholdHint = document.getElementById('threshold-hint');
const modeBtns = document.querySelectorAll('.mode-btn');
const rescanBtn = document.getElementById('rescan-btn');
const optionsBtn = document.getElementById('options-btn');
const resetBtn = document.getElementById('reset-btn');

let currentMode = 'label';

// ─── Load settings ────────────────────────────────────────────────────────
chrome.storage.sync.get(['settings'], ({ settings = {} }) => {
  masterToggle.checked = settings.enabled !== false;
  toggleImages.checked = settings.scanImages !== false;
  thresholdSlider.value = settings.threshold || 40;
  updateThresholdHint(settings.threshold || 40);
  setMode(settings.mode || 'label');
});

// ─── Load stats ───────────────────────────────────────────────────────────
chrome.runtime.sendMessage({ type: 'GET_GLOBAL_STATS' }, (stats = {}) => {
  document.getElementById('stat-flagged').textContent = stats.totalFlagged || 0;
  document.getElementById('stat-images').textContent = stats.totalAiImages || 0;
  document.getElementById('stat-scanned').textContent = stats.totalScanned || 0;
  const total = (stats.totalFlagged || 0) + (stats.totalAiImages || 0);
  const scanned = stats.totalScanned || 0;
  document.getElementById('stat-accuracy').textContent =
    scanned > 0 ? Math.round((total / scanned) * 100) + '%' : '—';
});

// ─── Mode buttons ─────────────────────────────────────────────────────────
modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    setMode(btn.dataset.mode);
    saveSettings();
  });
});

function setMode(mode) {
  currentMode = mode;
  modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
}

// ─── Threshold ────────────────────────────────────────────────────────────
thresholdSlider.addEventListener('input', () => {
  updateThresholdHint(thresholdSlider.value);
  saveSettings();
});

function updateThresholdHint(val) {
  if (val <= 20) thresholdHint.textContent = 'Aggressive';
  else if (val <= 40) thresholdHint.textContent = 'Balanced';
  else if (val <= 60) thresholdHint.textContent = 'Strict';
  else thresholdHint.textContent = 'Very strict';
}

// ─── Save ─────────────────────────────────────────────────────────────────
function saveSettings() {
  chrome.storage.sync.set({
    settings: {
      enabled: masterToggle.checked,
      mode: currentMode,
      threshold: parseInt(thresholdSlider.value),
      scanImages: toggleImages.checked,
    }
  });
}

masterToggle.addEventListener('change', saveSettings);
toggleImages.addEventListener('change', saveSettings);

// ─── Buttons ──────────────────────────────────────────────────────────────
rescanBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { type: 'RESCAN' });
  });
});

optionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

resetBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'RESET_STATS' });
  ['stat-flagged', 'stat-images', 'stat-scanned'].forEach(id => {
    document.getElementById(id).textContent = '0';
  });
  document.getElementById('stat-accuracy').textContent = '—';
});
