let links = {};

function closeDetailedView() {
  const e = new MouseEvent('tap', {
    'view': window,
    'bubbles': true,
    'cancelable': true
  });

  document.querySelector('#singleview-close').dispatchEvent(e);
}

function doClick(parent, index) {
  const elem = parent.querySelectorAll('[data-itemid]')[index];
  const container = elem.closest('.day-thumb-container');
  const e = new MouseEvent('tap', {
    'view': window,
    'bubbles': true,
    'cancelable': true
  });

  Object.defineProperty(e, 'target', {value: elem, enumerable: true});

  container.dispatchEvent(e);
}

function doClickForLoadRest(elem) {
  const e = new MouseEvent('tap', {
    'view': window,
    'bubbles': true,
    'cancelable': true
  });

  elem.dispatchEvent(e);
}

function getItemId(elem) {
  return elem.getAttribute('data-itemid');
}

function waitUntilLoaded(parent, index) {
  return new Promise((resolve) => {
    let interval = setInterval(() => {
      let elem = parent.querySelectorAll('[data-itemid]')[index];

      if (getItemId(elem)) {
        clearInterval(interval);

        resolve();
      }
    }, 300);
  });
}

function sleep(n) {
  return new Promise((resolve) => {
    let timer = setTimeout(() => {
      clearTimeout(timer);

      resolve();
    }, n);
  });
}

function setLinks(links) {
  const slideshowElem = document.querySelector('#slideshow');
  const imageElems = slideshowElem.querySelectorAll('div');

  for (let i = 0; i < imageElems.length; i++) {
    const imageElemCur = imageElems[i];
    const title = document.querySelector('#photo-title').getAttribute('title');
    const cssMatrixAsArray = imageElemCur.style.transform
      .replace('matrix3d(', '')
      .replace(')', '')
      .split(', ');

    // take only the one which visible at the center of the screen;
    if (cssMatrixAsArray.some((cur => cur > 1))) {
      continue;
    }

    let bg = imageElemCur.style.backgroundImage;

    bg = bg.replace('url', '');
    bg = bg.replace(/"/g, '');

    const re = /\(([^)]+)\)/;

    links[title] = bg.match(re).pop();
  }
}

function scrollToElem(elem) {
  const top = elem.offsetTop;
  const height = elem.offsetHeight;
  const y = top + height;

  window.scrollTo(0, y);
}

async function proceedChildren(parent, links) {
  let all = parent.querySelectorAll('[data-itemid]');

  for (let i = 0; i < all.length; i++) {
    let elemCur = parent.querySelectorAll('[data-itemid]')[i];

    scrollToElem(elemCur);

    if (!getItemId(elemCur)) {
      console.log('waiting until loaded, id is: ', i);

      await waitUntilLoaded(parent, i);

      elemCur = parent.querySelectorAll('[data-itemid]')[i];
    }

    if (elemCur.classList.contains('day-has-overlay')) {
      const overlay = elemCur.querySelector('.day-thumb-overlay');

      doClickForLoadRest(overlay);

      await sleep(3000); //todo: поменять на XHTTPRequest как в яндекс музыке было сделано

      all = parent.querySelectorAll('[data-itemid]');
    }

    doClick(parent, i);

    await sleep(500);

    setLinks(links);
    closeDetailedView();

    await sleep(500);
  }
}

async function start() {
  let dayItemsAll = document.querySelectorAll('.day-items');
  let dayItem;

  for (let i = 0; i < dayItemsAll.length; i++) {
    const dayItemCur = dayItemsAll[i];

    if (dayItemCur.classList.contains('done') === false) {
      dayItem = dayItemCur;

      break;
    }
  }

  const label = dayItem.closest('.month-group').getAttribute('id');

  if (!links[label]) {
    links[label] = {};
  }

  scrollToElem(dayItem);

  await proceedChildren(dayItem, links[label]);

  dayItem.classList.add('done');

  // if ((window.innerHeight + window.scrollY) < document.body.scrollHeight) {
  if (Object.keys(links).length <= 2) {
    return await start();
  } else {
    return links;
  }
}

document.addEventListener('PMOEXT_START', async () => {
  const links = await start();
  const evt = new CustomEvent('PMOPAGE_END', { detail: links });

  document.dispatchEvent(evt);
});
