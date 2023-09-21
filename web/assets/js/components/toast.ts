import { Component } from 'sevejs';
import { gsap } from 'gsap';

type MessageType = 'warning' | 'info' | 'error';
const Toast = class extends Component {
  constructor(opts: any) {
    super(opts);
  }

  init() {
    // automatically called at start
    console.log('Toast component init');

    (this.timer = 4000), this.timeout;
    this.DOM.content = this.DOM.el.querySelector('#js-toastdesc');
    this.DOM.type = this.DOM.el.querySelector('#js-toasttype');
  }

  appear(message: string, type: MessageType = 'warning') {
    clearTimeout(this.timeout);
    this.DOM.content.innerHTML = message;
    this.DOM.type.innerHTML = type;
    gsap.to(this.DOM.el, { y: 0 });
    this.timeout = setTimeout(() => {
      this.disappear();
    }, this.timer);
  }
  disappear() {
    gsap.to(this.DOM.el, { y: '-8rem' });
  }

  destroy() {}
};

export { Toast };
