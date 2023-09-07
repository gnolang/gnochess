// @ts-nocheck
import { Component } from "sevejs";
import { gsap } from "gsap";

type Options = {
  token: string;
  category: "rapid" | "blitz";
  timer: number;
};
type Events = Record<string, any>;

const Gameoptions = class extends Component {
  constructor(opts: any) {
    super(opts);
    this.states = [
      { name: "token", panels: ["token"], ctrls: ["cross", "Connection"] },
      { name: "token", panels: ["game"], ctrls: ["arrow", "Play"] },
    ];
    this.currentState = 0;
    this.options = {
      token: "",
      category: "rapid",
      timer: 5,
    } as Options;

    this.events = {} as Events;
  }

  init() {
    // automatically called at start
    console.log("PlayControls component init");

    //Vars
    this.timerCount = 1;
    this.timerMin = 0;
    this.timerMax = 60;

    //DOM

    this.DOM.paneConnection = this.DOM.el.querySelector("#js-connection");
    this.DOM.paneCategory = this.DOM.el.querySelector("#js-category");
    this.DOM.paneTimer = this.DOM.el.querySelector("#js-timer");
    this.DOM.paneLoader = this.DOM.el.querySelector("#js-paneloader");
    this.DOM.categoryBtns = [...this.DOM.el.querySelectorAll(".js-categoryUpdate")];
    this.DOM.categorySwitch = this.DOM.el.querySelector("#js-categorySwitch");
    this.DOM.timerBtns = [...this.DOM.el.querySelectorAll(".js-timerUpdate")];
    this.DOM.timerDisplay = this.DOM.el.querySelector("#js-timerdisplay");
    this.DOM.ctrl0 = this.DOM.el.querySelector("#js-gameoptions-ctr0");
    this.DOM.ctrl1 = this.DOM.el.querySelector("#js-gameoptions-ctr1");

    //controls events
    this.events.clickOnCtrl0 = this.on({
      e: "click",
      target: this.DOM.ctrl0,
      cb: this._clickOnCtrl0.bind(this),
    });
    this.events.clickOnCtrl1 = this.on({
      e: "click",
      target: this.DOM.ctrl1,
      cb: this._clickOnCtrl1.bind(this),
    });

    //category events
    this.DOM.categoryBtns.forEach((categoryBtn, i) => {
      this.events["clickOnCategory" + i] = this.on({
        e: "change",
        target: categoryBtn,
        cb: this._updateCategory.bind(this),
      });
    });

    //timer events
    this.DOM.timerBtns.forEach((timerBtn, i) => {
      this.events["clickOnTimer" + i] = this.on({
        e: "click",
        target: timerBtn,
        cb: this._updateTimer.bind(this),
      });
    });

    //tl
    this.switchAnimation1 = gsap
      .timeline({ paused: true })
      .to(this.DOM.paneConnection, { autoAlpha: 0, display: "none", duration: 0.6 })
      .to(this.DOM.paneCategory, { autoAlpha: 1, display: "flex", duration: 0.6 })
      .to(this.DOM.paneTimer, { autoAlpha: 1, display: "flex", duration: 0.6 }, "<");

    this.switchAnimation2 = gsap
      .timeline({ paused: true })
      .to(this.DOM.paneCategory, { autoAlpha: 0, display: "none", duration: 0.6 })
      .to(this.DOM.paneTimer, { autoAlpha: 0, display: "none", duration: 0.6 }, "<")
      .to(this.DOM.ctrl1, { autoAlpha: 0, duration: 0.6 }, "<")
      .to(this.DOM.paneLoader, { autoAlpha: 1, display: "flex", duration: 0.6 });

    //actions
    this.DOM.timerDisplay.innerHTML = this.options.timer;
    this.appear();
  }

  _clickOnCtrl0() {
    this.currentState--;

    if (this.currentState === 1) {
      this.switchAnimation2.reverse();
    } else {
      this.call("goTo", ["/"], "Router");
    }
  }
  _clickOnCtrl1() {
    this.currentState++;

    if (this.currentState === 1) {
      this.options.token = this._inputToken();
      this.DOM.ctrl1.innerHTML = this.states[this.currentState].ctrls[1]; //todo: animation
      this.switchAnimation1.play();
    } else if (this.currentState === 2) {
      this.options.category = this._inputCategory();
      this.switchAnimation2.play();

      //   console.log(this.options); // -> to start game

      //todo to remove
      //setup game
      setTimeout(() => {
        this.disappear().then((_) => {
          gsap.set("#js-background", { transformOrigin: "center" });
          gsap.to("#js-background", { scale: 1.1 });
          this.call("appear", "", "gameplayers", "me");
          this.call("appear", "", "gameplayers", "rival");
          this.call("appear", "", "gamecontrols");
          // this.call("appear", "", "gamefen");
        });
      }, 2000);
    }
  }

  _inputToken() {
    return this.DOM.el.querySelector("#id-gameoptions-token").value || "";
  }

  _inputCategory() {
    return [...document.getElementsByName("category")].filter((el) => el.checked)[0].value;
  }

  _updateTimer(e) {
    this.options.timer = Math.min(this.timerMax, Math.max(this.timerMin, this.options.timer + parseInt(e.currentTarget.dataset.ctrl === "+" ? this.timerCount : -this.timerCount, 10)));
    this.DOM.timerDisplay.innerHTML = this.options.timer;
  }

  _updateCategory(e) {
    const cat = e.currentTarget.value === "blitz";
    gsap.to(this.DOM.categorySwitch, { x: cat ? "100%" : "0" });
    gsap.to("#js-categoryWord", { x: cat ? "-60%" : "-15%" });
  }

  appear() {
    gsap.to(this.DOM.el, { autoAlpha: 1 });
  }
  disappear() {
    const tl = gsap.timeline();
    tl.to("#gameoptions-actions", { autoAlpha: 0, duration: 0.3 });
    tl.to(".js-pane", { autoAlpha: 0, duration: 0.3 }, 0);
    tl.to(
      this.DOM.el,
      {
        autoAlpha: 0,
        height: 0,
        display: "none",
        duration: 0.7,
      },
      "<+.1"
    );

    return tl;
  }

  destroy() {
    for (const prop of Object.getOwnPropertyNames(this.options)) {
      delete this.options[prop];
    }
    this.switchAnimation1.kill();
    this.switchAnimation2.kill();
  }
};

export { Gameoptions };
