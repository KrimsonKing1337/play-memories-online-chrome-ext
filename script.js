function sleep(n) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);

      resolve();
    }, n);
  });
}

function getDate(file) {
  const withoutPrefix = file.substring(file.indexOf('_') + 1);
  const dateFull = withoutPrefix.substring(0, withoutPrefix.indexOf('_'));
  const date = dateFull.substring(4);
  const day = date.substring(2);
  const month = date.substring(0, 2);
  const year = dateFull.substring(0, 4);

  return {
    day,
    month,
    year
  }
}

async function downloadPause(downloadId) {
  return new Promise((resolve) => {
    chrome.downloads.pause(downloadId, () => {
      resolve();
    });
  });
}

async function downloadResume(downloadId) {
  return new Promise((resolve) => {
    chrome.downloads.resume(downloadId, () => {
      resolve();
    });
  });
}

async function downloadSearch(downloadId) {
  return new Promise((resolve) => {
    chrome.downloads.search({id: downloadId}, (downloadItems) => {
      resolve(downloadItems[0]);
    });
  });
}

function onDownloadComplete(downloadId) {
  return new Promise(resolve => {
    chrome.downloads.onChanged.addListener(function onChanged({id, state}) {
      if (id === downloadId && state && state.current !== 'in_progress') {
        chrome.downloads.onChanged.removeListener(onChanged);

        resolve(state.current === 'complete');
      }
    });
  });
}

function download(url, filename) {
  return new Promise((resolve, reject) => {
    chrome.downloads.download({
      url,
      filename,
    }, async (downloadId) => {
      console.log('downloadId', downloadId);

      if (downloadId === undefined) {
        reject(downloadId);

        return;
      }

      const downloadComplete = await onDownloadComplete(downloadId);

      if (!downloadComplete) {
        await downloadResume(downloadId);
      }

      resolve();
    });
  });
}

async function downloadAll(links) {
  const folders = Object.keys(links);

  for (let i = 0; i < folders.length; i++) {
    const folderCur = folders[i];

    const files = Object.keys(links[folderCur]);

    for (let j = 0; j < files.length; j++) {
      const fileCur = files[j];

      const { day, month, year } = getDate(fileCur);
      const url = links[folderCur][fileCur];
      const filename = `PMO/${year}/${month}/${day}/${fileCur}`;

      await download(url, filename);
    }
  }
}

document.querySelector('.button').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {from: 'PMOEXT', command: 'start'});
  });
}, false);

chrome.runtime.onMessage.addListener((request, sender) => {
  if (!request.from === 'PMOPAGE') {
    return;
  }

  if (request.command === 'download') {
    console.log('script get command download');

    const { links } = request;

    downloadAll(links);
  }
});
