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
    leave({ current }: { current: any }) {
      const prom = new Promise<void>((resolve) => {
        const dashboardheader = current.container.querySelector(".js-dashboardheader");
        const dashboard = current.container.querySelector(".js-dashboard");
        const dashboardArticle = current.container.querySelectorAll(".js-dashboard article");
        if (dashboardheader) gsap.to(dashboardheader, { autoAlpha: 0, duration: 0.4 });
        if (dashboard) {
          gsap.to(dashboard, { "--sidepane": "100%" });
          gsap.to(dashboardArticle, { autoAlpha: 0, duration: 0.4, onComplete: () => resolve() });
        } else {
          resolve();
        }
      });
      return Promise.all([
        app.call("disappear", "", "Gameoptions"),
        app.call("disappear", "", "Gameplayers", "me"),
        app.call("disappear", "", "Gameplayers", "rival"),
        app.call("disappear", "", "Gamecontrols"),
        app.call("disappear", "", "Gameboard"),
        prom,
      ]);
    },
    enter() {
      DOM.titles = [...document.querySelectorAll(".js-title")];
      gsap.set(".js-title", { autoAlpha: 1 });
      gsap.set("#js-background", { transformOrigin: "left" });

      DOM.titles.forEach((title: Element) => {
        charming(title, { tagName: "span", type: "word", nesting: 1, classPrefix: "word word" });
        charming(title, { tagName: "span", type: "letter", nesting: 2, classPrefix: "char char" });
      });
      gsap.to("#js-background", { x: "50%", scaleY: 1, autoAlpha: 1, scaleX: 1.1, duration: 1 });
      gsap.to(".js-title .char > span", { y: "0%", stagger: 0.04, duration: 0.4, delay: 0.7 });
      gsap.to(".js-subtitle", { autoAlpha: 1, duration: 1, delay: 0.8 });
      gsap.to(".js-content", { autoAlpha: 1, duration: 1, delay: 0.8 });

      app.call("changeStatus", ["init"], "webgl");
      app.call("moveScene", "", "webgl");
      app.call("appear", "", "webgl");
    },
    once() {
      DOM.titles = [...document.querySelectorAll(".js-title")];

      DOM.titles.forEach((title: Element) => {
        charming(title, { tagName: "span", type: "word", nesting: 1, classPrefix: "word word" });
        charming(title, { tagName: "span", type: "letter", nesting: 2, classPrefix: "char char" });
      });

      gsap.to("#js-background", { autoAlpha: 1, x: "50%" });
      gsap.set(".js-title", { autoAlpha: 1 });
      gsap.to(".js-title  .char > span", { y: "-10%", stagger: 0.04, duration: 0.4 });
      gsap.to(".js-subtitle", { autoAlpha: 1, duration: 1, delay: 0.6 });
      gsap.to(".js-content", { autoAlpha: 1, duration: 1, delay: 0.6 });
    },
    to: {
      namespace: ["home"],
    },
  };
};

export { homeView, homeTransition };
