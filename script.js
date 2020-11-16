document.querySelector('.button').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {from: 'PMOEXT', command: 'start'});
  });
}, false);

chrome.runtime.onMessage.addListener((request, sender) => {
  if (!request.from === 'PMOPAGE') {
    return;
  }

  if (request.command === 'end') {
    const { links } = request;

    Object.keys(links).forEach((folder) => {
      Object.keys(links[folder]).forEach((file) => {
        const withoutPrefix = file.substring(file.indexOf('_') + 1);
        const dateFull = withoutPrefix.substring(0, withoutPrefix.indexOf('_'));
        const date = dateFull.substring(4);
        const day = date.substring(2);
        const month = date.substring(0, 2);
        const year = dateFull.substring(0, 4);

        chrome.downloads.download({
          url: links[folder][file],
          filename: `PMO/${year}/${month}/${day}/${file}`
        });
      });
    });
  }
});