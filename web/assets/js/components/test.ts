import { Component } from 'sevejs';

const Test = class extends Component {
  constructor(opts: any) {
    super(opts);
  }

  init() {
    // automatically called at start
    console.log('Init tes');
  }

  disappear() {}

  destroy() {
    console.log('destroy tets');
  }
};

export { Test };
