function getFileName(filename) {
  const arr = filename.split('.');
  const ext = arr.pop();
  const nameWithSmallExt = `${arr.join('.')}.${ext.toLowerCase()}`;

  return nameWithSmallExt.replace('jfif', 'jpg');
}

function sleep(n) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);

      resolve();
    }, n);
  });
}

function getDate(date) {
  const dateWithoutSeparator = date.replace(/\//g, '');
  const day = dateWithoutSeparator.substring(0, 2);
  const month = dateWithoutSeparator.substring(2, 4);
  const year = dateWithoutSeparator.substring(4, 8);

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
  const fileNameWithoutJfif = getFileName(filename);

  return new Promise((resolve, reject) => {
    chrome.downloads.download({
      url,
      filename: fileNameWithoutJfif,
    }, async (downloadId) => {
      console.log(url, filename);

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
      const { date, url } = links[folderCur][fileCur];
      const { day, month, year } = getDate(date);
      const filename = `PMO/${year}/${month}/${day}/${fileCur}`;

      await download(url, filename);
    }
  }
}

document.querySelector('#button-start').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {from: 'PMOEXT', command: 'start'});
  });
}, false);

document.querySelector('#button-pause').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {from: 'PMOEXT', command: 'pause'});
  });
}, false);

chrome.runtime.onMessage.addListener((request, sender) => {
  if (!request.from === 'PMOPAGE') {
    return;
  }

  if (request.command === 'download') {
    const { links } = request;

    downloadAll(links);
  }
});
