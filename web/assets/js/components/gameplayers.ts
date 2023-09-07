// @ts-nocheck
import { Component } from "sevejs";
import { gsap } from "gsap";
import { DateTime, Interval } from "luxon";
import { truncateString } from "../utils/truncate";

const Gameplayers = class extends Component {
  constructor(opts: any) {
    super(opts);
    this.timerActive = false;
  }

  init() {
    // automatically called at start
    console.log("PlayPlay component init");

    this.DOM.timer = this.DOM.el.querySelector(".js-playertime");
    this.DOM.pawns = this.DOM.el.querySelector(".js-playercapturepawns");
    this.DOM.token = this.DOM.el.querySelector(".js-playertoken");
    this.DOM.avatar = this.DOM.el.querySelector(".js-playeravatar");
    this.DOM.content = this.DOM.el.querySelector(".js-playercontent");

    // this.DOM.stop = this.DOM.el.querySelector(".js-reset");
    // this.DOM.resume = this.DOM.el.querySelector(".js-resume");

    // this.on({ e: "click", target: this.DOM.stop, cb: this.stopTimer.bind(this, 0) });
    // this.on({ e: "click", target: this.DOM.resume, cb: this.startTimer.bind(this) });
    this.config(60, "white", "glnaglnaglnaglnae558");
  }

  appear() {
    gsap.to(this.DOM.el, { autoAlpha: 1, display: "flex" });
  }
  disappear() {
    return gsap.to(this.DOM.el, { autoAlpha: 0, display: "none" });
  }

  config(time, color, token = "") {
    //-- config game --
    //config token + type
    this.DOM.token.innerHTML = truncateString(token, 4, 4);

    //config timer
    this.timer = time;
    // setTimeout(this.startTimer(), 2000); //mock timer

    //config pawn color
    gsap.set(this.DOM.avatar, { backgroundColor: color === "black" ? "#777777" : "#FFFFFF" });
    gsap.set(this.DOM.content, { color: color === "black" ? "#777777" : "#FFFFFF" });

    //config avatar
  }

  startTimer() {
    this.timerActive = true;
    let timeleft;
    const pad = (n) => (n < 10 ? "0" : "") + n;
    const timer = (datetarget) => {
      const dateNow = DateTime.now();
      timeleft = Interval.fromDateTimes(dateNow, datetarget).length();

      const minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeleft % (1000 * 60)) / 1000);
      this.DOM.timer.innerHTML = `${pad(minutes)}:${pad(seconds)}`;
    };

    const date = DateTime.now();
    const datetarget = date.plus({ seconds: this.timer });
    clearInterval(this.clock);

    timer(datetarget);
    this.clock = setInterval(() => {
      timer(datetarget);
      this.timer--;

      if (this.timer <= 0) {
        clearInterval(this.clock);
        this.DOM.timer.innerHTML = `00:00`;
      }
    }, 1000);
  }
  stopTimer(increment = 0) {
    clearInterval(this.clock);
    if (this.timerActive) {
      this.timer += increment;
    }
    this.timerActive = false;
  }

  capturePawn(pawn: string) {
    const pawnEl = document.createElement("DIV");
    this.DOM.pawns.appendChild(pawnEl);
  }

  destroy() {
    clearInterval(this.clock);
  }
};

export { Gameplayers };
