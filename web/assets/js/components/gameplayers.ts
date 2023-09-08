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
  }

  appear() {
    gsap.to(this.DOM.el, { autoAlpha: 1, display: "flex" });
  }
  disappear() {
    return gsap.to(this.DOM.el, { autoAlpha: 0, display: "none", duration: 0.8 });
  }

  config(time, color, token = "") {
    //-- config game --
    //config token + type
    this.DOM.token.innerHTML = truncateString(token, 4, 4);

    //config timer
    this.increment = time[1];
    this.timer = time[0] * 60; //sec to min
    this._createTime(this._dateTarget());

    //config pawn color
    gsap.set(this.DOM.avatar, { backgroundColor: color === "b" ? "#777777" : "#FFFFFF" });
    gsap.set(this.DOM.content, { color: color === "b" ? "#777777" : "#FFFFFF" });

    //config avatar
  }

  _createTime(datetarget) {
    const pad = (n) => (n < 10 ? "0" : "") + n;

    const dateNow = DateTime.now();
    const timeleft = Interval.fromDateTimes(dateNow, datetarget).length();

    const minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeleft % (1000 * 60)) / 1000);
    this.DOM.timer.innerHTML = `${pad(minutes)}:${pad(seconds)}`;
  }

  _dateTarget() {
    const date = DateTime.now();
    return date.plus({ seconds: this.timer });
  }

  startTimer() {
    clearInterval(this.clock);

    this.timerActive = true;
    const datetarget = this._dateTarget();

    const clockAction = () => {
      this.timer--;

      this._createTime(datetarget);

      if (this.timer <= 0) {
        clearInterval(this.clock);
        this.DOM.timer.innerHTML = `00:00`;
      }
    };

    this.clock = setInterval(clockAction, 1000);
  }
  stopTimer() {
    clearInterval(this.clock);
    if (this.timerActive) {
      this.timer += this.increment;
    }
    this.timerActive = false;
  }

  capturePawn(pawn: string) {
    console.log("captureeee");
    const pawnEl = document.createElement("DIV");
    pawnEl.innerHTML = pawn;
    this.DOM.pawns.appendChild(pawnEl);
  }

  destroy() {
    clearInterval(this.clock);
  }
};

export { Gameplayers };
