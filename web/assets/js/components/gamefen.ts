import { Component } from 'sevejs';
import { gsap } from 'gsap';

const Gamefen = class extends Component {
  constructor(opts: any) {
    super(opts);
  }

  init() {
    // automatically called at start
    console.log('PlayFen component init');
  }

  appear() {
    gsap.to(this.DOM.el, { autoAlpha: 1, display: 'flex' });
  }
  disappear() {}

  destroy() {}
};

export { Gamefen };
