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

  static waitUntilLoaded(parent, index) {
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

  constructor() {
    this.links = {};
    this.segment = null;
    this.parent = null;
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

      if (!getItemId(elemCur)) {
        console.log('waiting until loaded, id is: ', i);

        await Inject.waitUntilLoaded(this.parent, i);

        elemCur = this.parent.querySelectorAll('[data-itemid]')[i];
      }

      if (elemCur.classList.contains('day-has-overlay')) {
        const overlay = elemCur.querySelector('.day-thumb-overlay');

        Inject.doClickForLoadRest(overlay);

        await sleep(3000); //todo: поменять на XHTTPRequest как в яндекс музыке было сделано

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

    // if ((window.innerHeight + window.scrollY) < document.body.scrollHeight) {
    if (Object.keys(this.links).length <= 2) {
      return await this.getLinks();
    } else {
      return this.links;
    }
  }
}

const injectInst = new Inject();

document.addEventListener('PMOEXT_START', async () => {
  const links = await injectInst.getLinks();
  const evt = new CustomEvent('PMOPAGE_END', { detail: links });

  document.dispatchEvent(evt);
});
