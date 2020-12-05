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

  static doClick(parent, index) {
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

  static doClickForLoadRest(element) {
    const e = new MouseEvent('tap', {
      'view': window,
      'bubbles': true,
      'cancelable': true
    });

    element.dispatchEvent(e);
  }

  static getUrl(element) {
    let bg = element.style.backgroundImage;

    bg = bg.replace('url', '');
    bg = bg.replace(/"/g, '');

    const re = /\(([^)]+)\)/;

    return bg.match(re).pop();
  }

  // take only the one which visible at the center of the screen;
  static isVisible(element) {
    const cssMatrixAsArray = element.style.transform
      .replace('matrix3d(', '')
      .replace(')', '')
      .split(', ');

    return cssMatrixAsArray.every((cur) => cur === '0' && cur === '1');
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

  static addXHTTPRequestEventListener() {
    function onSuccessHandler(e) {
      if (e.target.responseURL.indexOf('/items?') !== -1) {
        this.itemsIsLoading = true;
      }

      this.loading = false;
    }

    function onErrorHandler() {
      this.itemsIsLoading = false;
      this.loading = false;
    }

    XMLHttpRequest.prototype.realSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (value) {
      this.loading = true;
      this.itemsIsLoading = false;

      this.addEventListener('load', onSuccessHandler, false);
      this.addEventListener('error', onErrorHandler, false);
      this.addEventListener('abort', onErrorHandler, false);
      this.realSend(value);
    };
  }

  constructor() {
    this.links = {};
    this.segment = null;
    this.parent = null;
    this.loading = false;
    this.itemsIsLoading = false;
  }

  async waitUntilLoaded() {
    if (this.loading === false) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.loading === false) {
          clearInterval(interval);

          resolve(this.itemsIsLoading);
        }
      }, 50);
    });
  }

  setSegment() {
    const slideshowElem = document.querySelector('#slideshow');
    const imageElements = slideshowElem.querySelectorAll('div');

    for (let i = 0; i < imageElements.length; i++) {
      const imageElementCur = imageElements[i];
      const title = Inject.getPhotoTitle();

      if (Inject.isVisible(imageElementCur)) {
        this.segment[title] = Inject.getUrl(imageElementCur);

        break;
      }
    }
  }

  async proceedChildren() {
    let elements = this.parent.querySelectorAll('[data-itemid]');

    for (let i = 0; i < elements.length; i++) {
      let elemCur = this.parent.querySelectorAll('[data-itemid]')[i];

      Inject.scrollToElement(elemCur);

      if (!Inject.getItemId(elemCur)) {
        console.warn('waiting until loaded, id is: ', i);

        await this.waitUntilLoaded();

        elemCur = this.parent.querySelectorAll('[data-itemid]')[i];
      }

      if (elemCur.classList.contains('day-has-overlay')) {
        const overlay = elemCur.querySelector('.day-thumb-overlay');

        Inject.doClickForLoadRest(overlay);

        await this.waitUntilLoaded();

        elements = this.parent.querySelectorAll('[data-itemid]');
      }

      Inject.doClick(this.parent, i);

      await Inject.sleep(500);

      this.setSegment();
      Inject.closeDetailedView();

      await Inject.sleep(500);
    }
  }

  async getLinks() {
    this.parent = Inject.getFirstDayItemWhichIsNotDone();
    const label = Inject.getMonth(this.parent);

    if (!this.links[label]) {
      this.links[label] = {};
    }

    this.segment = this.links[label];

    Inject.scrollToElement(this.parent);

    await this.proceedChildren();

    this.parent.classList.add('done');

    if ((window.innerHeight + window.scrollY) < document.body.scrollHeight) {
    // if (Object.keys(this.links).length <= 2) {
      return await this.getLinks();
    } else {
      return this.links;
    }
  }
}

const injectInst = new Inject();

document.addEventListener('PMOEXT_START', async () => {
  Inject.addXHTTPRequestEventListener();

  const links = await injectInst.getLinks();
  const evt = new CustomEvent('PMOPAGE_END', { detail: links });

  document.dispatchEvent(evt);

  Inject.removeXHTTPRequestEventListener();
});
