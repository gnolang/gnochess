// @ts-nocheck
import { Component } from "sevejs";

const Gameoptions = class extends Component {
  constructor(opts: any) {
    super(opts); // "opts" arg from constructor to super is a mandatory to share components across the app
  }

  init() {
    // automatically called at start
    console.log("PlayControls component init");
  }

  destroy() {}
};

export { Gameoptions };
