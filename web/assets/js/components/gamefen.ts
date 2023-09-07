// @ts-nocheck
import { Component } from "sevejs";
import { gsap } from "gsap";

const Gamefen = class extends Component {
  constructor(opts: any) {
    super(opts);
  }

  init() {
    // automatically called at start
    console.log("PlayFen component init");

    //Vars
    this.timerMax = 60;

    //DOM

    // this.DOM.paneConnection = this.DOM.el.querySelector("#js-connection");

    //controls events
    // this.events.clickOnCtrl0 = this.on({
    //   e: "click",
    //   target: this.DOM.ctrl0,
    //   cb: this._clickOnCtrl0.bind(this),
    // });

    //actions
    // this.DOM.timerDisplay.innerHTML = this.options.timer;
    // this.appear();
  }

  appear() {
    gsap.to(this.DOM.el, { autoAlpha: 1, display: "flex" });
  }
  disappear() {
    // const tl = gsap.timeline();
    // tl.to("#gameoptions-actions", { autoAlpha: 0, duration: 0.3 });
    // tl.to(".js-pane", { autoAlpha: 0, duration: 0.3 }, 0);
    // tl.to(
    //   this.DOM.el,
    //   {
    //     autoAlpha: 0,
    //     height: 0,
    //     duration: 0.7,
    //   },
    //   "<+.1"
    // );
    // return tl;
  }

  destroy() {}
};

export { Gamefen };
