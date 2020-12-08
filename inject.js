class Inject {
  static getItemId(element) {
    return element.getAttribute('data-itemid');
  }

  static sleep(n) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);

        resolve();
      }, n);
    });
  }

  static scrollToElement(element) {
    const top = element.offsetTop;
    const height = element.offsetHeight;
    const y = top + height;

    window.scrollTo(0, y);
  }

  static closeDetailedView() {
    const e = new MouseEvent('tap', {
      'view': window,
      'bubbles': true,
      'cancelable': true
    });

    document.querySelector('#singleview-close').dispatchEvent(e);
  }

  static waitUntilLoadedOld(parent, index) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const element = parent.querySelectorAll('[data-itemid]')[index];

        if (Inject.getItemId(element)) {
          clearInterval(interval);

          resolve();
        }
      }, 300);
    });
  }

  static doClickItem(parent, index) {
    const element = parent.querySelectorAll('[data-itemid]')[index];
    const container = element.closest('.day-thumb-container');
    const e = new MouseEvent('tap', {
      'view': window,
      'bubbles': true,
      'cancelable': true
    });

    Object.defineProperty(e, 'target', {value: element, enumerable: true});

    container.dispatchEvent(e);
  }

  static doClick(element) {
    const e = new MouseEvent('tap', {
      'view': window,
      'bubbles': true,
      'cancelable': true
    });

    element.dispatchEvent(e);
  }

  static getImageId(element) {
    const bgImage = element.style.backgroundImage;
    const start = '&target=';
    const startIndex = bgImage.indexOf(start);
    const end = '%2C';
    const endIndex = bgImage.indexOf(end);

    return bgImage.substring(startIndex + start.length, endIndex);
  }

  static getImageStaticUrlById(id) {
    const title = Inject.getPhotoTitle();

    return `https://ws.playmemoriesonline.com/api/3.0/items/${id}/source?redirect=true&ok=_ok_32a&disp=attachment,${title}`;
  }

  static getImageUrl(element) {
    const id = Inject.getImageId(element);

    return Inject.getImageStaticUrlById(id);
  }

  // take only the one which visible at the center of the screen;
  static isVisible(element) {
    const cssMatrixAsArray = element.style.transform
      .replace('matrix3d(', '')
      .replace(')', '')
      .split(', ');

    return cssMatrixAsArray.every((cur) => cur === '0' || cur === '1');
  }

  static getMonth(parent) {
    return parent.closest('.month-group').getAttribute('id');
  }

  static getPhotoTitle() {
    return document.querySelector('#photo-title').getAttribute('title');
  }

  static getFirstDayItemWhichIsNotDone() {
    const dayItemsAll = document.querySelectorAll('.day-items');

    for (let i = 0; i < dayItemsAll.length; i++) {
      const dayItemCur = dayItemsAll[i];

      if (dayItemCur.classList.contains('done') === false) {
        return dayItemCur;
      }
    }
  }

  static removeXHTTPRequestEventListener() {
    XMLHttpRequest.prototype.send = XMLHttpRequest.prototype.realSend;
  }

  static addXMLRequestEventListener() {
    function onSuccessHandler(e) {
      // if (e.target.responseURL.indexOf('/items?') !== -1) {}

      console.log(e.target.responseURL);

      this.loading = false;
    }

    function onErrorHandler() {
      this.loading = false;
    }

    XMLHttpRequest.prototype.realSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (value) {
      this.loading = true;

      this.addEventListener('load', onSuccessHandler, false);
      this.addEventListener('error', onErrorHandler, false);
      this.addEventListener('abort', onErrorHandler, false);
      this.realSend(value);
    };
  }

  static checkIfVideo(element) {
    return !!element.querySelector('.video-icon');
  }

  static getVideo() {
    const videoPlayer = document.querySelector('#videoplayer');

    return videoPlayer.querySelector('video');
  }

  static download(links) {
    const evt = new CustomEvent('PMOPAGE_DOWNLOAD', { detail: links });

    document.dispatchEvent(evt);
  }

  static async getUrl(imageElement) {
    if (Inject.checkIfVideo(imageElement)) {
      Inject.doClick(imageElement);

      await Inject.sleep(500);

      const video = Inject.getVideo();

      video.pause();

      return video.src;
    }

    return Inject.getImageUrl(imageElement);
  }

  static getDate() {
    const textContent = document.querySelector('#photo-date').textContent;
    const separateIndex = textContent.indexOf(' ');

    return textContent.substring(0, separateIndex);
  }

  constructor() {
    this.links = {};
    this.segment = null;
    this.parent = null;
    this.loading = false;
    this.pause = false;
  }

  waitForUnpause() {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!this.pause) {
          clearInterval(interval);

          resolve();
        }
      }, 50);
    });
  }

  togglePause() {
    this.pause = !this.pause;

    console.log('this.pause', this.pause);
  }

  async waitUntilLoaded() {
    if (this.loading === false) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.loading === false) {
          clearInterval(interval);

          resolve();
        }
      }, 50);
    });
  }

  async setSegment() {
    const slideshowElem = document.querySelector('#slideshow');
    const imageElements = slideshowElem.querySelectorAll('div');

    for (let i = 0; i < imageElements.length; i++) {
      const imageElementCur = imageElements[i];
      const title = Inject.getPhotoTitle();

      if (Inject.isVisible(imageElementCur)) {
        const url = await Inject.getUrl(imageElementCur);
        const date = Inject.getDate();

        this.segment[title] = {
          url,
          date,
        }

        break;
      }
    }
  }

  async proceedChildren() {
    let elements = this.parent.querySelectorAll('[data-itemid]');

    for (let i = 0; i < elements.length; i++) {
      await this.waitForUnpause();

      let elemCur = this.parent.querySelectorAll('[data-itemid]')[i];

      Inject.scrollToElement(elemCur);

      if (!Inject.getItemId(elemCur)) {
        console.warn('waiting until loaded, id is: ', i);

        await this.waitUntilLoaded();

        elemCur = this.parent.querySelectorAll('[data-itemid]')[i];
      }

      if (elemCur.classList.contains('day-has-overlay')) {
        const overlay = elemCur.querySelector('.day-thumb-overlay');

        Inject.doClick(overlay);

        await this.waitUntilLoaded();

        elements = this.parent.querySelectorAll('[data-itemid]');
      }

      Inject.doClickItem(this.parent, i);

      await Inject.sleep(500);

      await this.setSegment();
      Inject.closeDetailedView();

      await Inject.sleep(500);
    }
  }

  async getLinks() {
    await this.waitForUnpause();

    this.parent = Inject.getFirstDayItemWhichIsNotDone();

    if (!this.parent) {
      return this.links;
    }

    const label = Inject.getMonth(this.parent);

    if (!this.links[label]) {
      this.links[label] = {};
    }

    this.segment = this.links[label];

    Inject.scrollToElement(this.parent);

    await this.proceedChildren();

    this.parent.classList.add('done');

    await this.waitForUnpause();

    Inject.download(this.links);

    // console.log('this.links', this.links);

    this.links = {};
    this.segment = null;

    return await this.getLinks();
  }
}

const injectInst = new Inject();

document.addEventListener('PMOEXT_START', async () => {
  Inject.addXMLRequestEventListener();

  const links = await injectInst.getLinks();

  Inject.removeXHTTPRequestEventListener();

  Inject.download(links);
});

document.addEventListener('PMOEXT_PAUSE', async () => {
  injectInst.togglePause();
});
