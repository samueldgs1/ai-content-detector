const apiKey = document.getElementById('api-key');
const whitelist = document.getElementById('whitelist');
const customPhrases = document.getElementById('custom-phrases');
const saveBtn = document.getElementById('save-btn');
const status = document.getElementById('status');

chrome.storage.sync.get(['apiKey', 'whitelist', 'customPhrases'], (data) => {
  if (data.apiKey) apiKey.value = data.apiKey;
  if (data.whitelist) whitelist.value = data.whitelist.join('\n');
  if (data.customPhrases) customPhrases.value = data.customPhrases.join('\n');
});

saveBtn.addEventListener('click', () => {
  chrome.storage.sync.set({
    apiKey: apiKey.value.trim(),
    whitelist: whitelist.value.split('\n').map(s => s.trim()).filter(Boolean),
    customPhrases: customPhrases.value.split('\n').map(s => s.trim()).filter(Boolean),
  }, () => {
    status.textContent = '✓ Saved!';
    setTimeout(() => (status.textContent = ''), 2000);
  });
});
