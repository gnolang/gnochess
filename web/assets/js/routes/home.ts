import { gsap } from "gsap";
import { charming } from "../utils/charming";
const homeView = {
  namespace: "home",
  beforeEnter() {},
  afterEnter() {},
};

// DOM init
const DOM: Record<string, any> = {};

const homeTransition = (app: any) => {
  return {
    name: "play-transition",
    sync: true,
    leave() {
      return Promise.all([app.call("disappear", "", "Gameoptions"), app.call("disappear", "", "Gameplayers", "me"), app.call("disappear", "", "Gameplayers", "rival")]);
    },
    enter() {
      DOM.titles = [...document.querySelectorAll(".js-title")];
      gsap.set(".js-title", { autoAlpha: 1 });
      gsap.set("#js-background", { transformOrigin: "left" });

      DOM.titles.forEach((title: Element) => {
        charming(title, { tagName: "span", type: "letter", nesting: 2, classPrefix: "char char" });
      });
      gsap.to("#js-background", { x: "50%", scaleY: 1, scaleX: 1.1, duration: 1 });
      gsap.to(".js-title > .char > span", { y: "0%", stagger: 0.04, duration: 0.4, delay: 0.7 });
      gsap.to(".js-subtitle", { autoAlpha: 1, duration: 1, delay: 0.8 });
      gsap.to(".js-content", { autoAlpha: 1, duration: 1, delay: 0.8 });
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
};

export { homeView, homeTransition };
