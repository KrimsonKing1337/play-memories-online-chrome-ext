function triggerEvent(name) {
  const evt = new CustomEvent(name);

  document.dispatchEvent(evt);
}

function inject() {
  const s = document.createElement('script');

  s.src = chrome.runtime.getURL('inject.js');
  s.onload = function() {
    this.remove();
  };

  (document.head || document.documentElement).appendChild(s);
}

chrome.runtime.onMessage.addListener((request, sender) => {
  if (!request.from === 'PMOEXT') {
    return;
  }

  if (request.command === 'start') {
    triggerEvent('PMOEXT_START');
  }
});

document.addEventListener('PMOPAGE_END', async (e) => {
  const links = e.detail;

  chrome.runtime.sendMessage({from: 'PMOPAGE', command: 'end', links});
});

inject();