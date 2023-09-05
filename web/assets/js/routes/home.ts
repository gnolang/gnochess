import { gsap } from "gsap";
import { charming } from "../utils/charming";
const homeView = {
  namespace: "home",
  beforeEnter() {},
  afterEnter() {},
};

// const getDOM = () => {
//   return {
//     background: document.getElementById("js-background"),
//     titles: [...document.querySelectorAll(".js-title > .char > span")],
//   };
// };

// DOM init
const DOM: Record<string, any> = {};

const homeTransition = {
  name: "play-transition",
  leave() {},
  enter() {
    DOM.titles = [...document.querySelectorAll(".js-title")];

    DOM.titles.forEach((title: Element) => {
      charming(title, { tagName: "span", type: "letter", nesting: 2, classPrefix: "char char" });
    });
    gsap.to("#js-background", { x: "50%", scaleX: 1.1 });
    gsap.set(".js-title", { autoAlpha: 1 });
    gsap.to(".js-title > .char > span", { y: "0%", stagger: 0.04, duration: 0.4 });
    gsap.to(".js-subtitle", { autoAlpha: 1, duration: 1, delay: 0.6 });
    gsap.to(".js-content", { autoAlpha: 1, duration: 1, delay: 0.6 });
  },
  once() {
    DOM.titles = [...document.querySelectorAll(".js-title")];

    DOM.titles.forEach((title: Element) => {
      charming(title, { tagName: "span", type: "letter", nesting: 2, classPrefix: "char char" });
    });

    gsap.to("#js-background", { autoAlpha: 1, x: "50%" });
    gsap.set(".js-title", { autoAlpha: 1 });
    gsap.to(".js-title > .char > span", { y: "0%", stagger: 0.04, duration: 0.4 });
    gsap.to(".js-subtitle", { autoAlpha: 1, duration: 1, delay: 0.6 });
    gsap.to(".js-content", { autoAlpha: 1, duration: 1, delay: 0.6 });
  },
  to: {
    namespace: ["home"],
  },
};

export { homeView, homeTransition };
