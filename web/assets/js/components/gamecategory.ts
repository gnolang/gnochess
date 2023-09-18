import { Component } from "sevejs";
import { gsap } from "gsap";
import { charming } from "../utils/charming";

const Gamecategory = class extends Component {
  constructor(opts: any) {
    super(opts);
  }

  init() {
    // automatically called at start

    this.DOM.category = this.DOM.el.querySelector("#game-category");
    console.log("PlayCategory component init");
  }

  setCategory(category: string) {
    this.DOM.category.innerHTML = category.toUpperCase();
    charming(this.DOM.category, { tagName: "span", type: "letter", nesting: 2, classPrefix: "char char" });
  }

  appear() {
    gsap.to(this.DOM.el, { autoAlpha: 1, display: "flex" });
    const chars = [...this.DOM.el.querySelectorAll(".char > span")];
    gsap.to(chars, { y: 0, stagger: 0.06 });
  }
  disappear() {
    gsap.to(this.DOM.el, { autoAlpha: 0, display: "none" });
    const chars = [...this.DOM.el.querySelectorAll(".char > span")];
    gsap.to(chars, { y: "100%" });
  }

  destroy() {}
};

export { Gamecategory };
