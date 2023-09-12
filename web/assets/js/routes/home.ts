import { gsap } from "gsap";
import { charming } from "../utils/charming";
const homeView = {
  namespace: "home",
  beforeEnter() {},
  afterEnter() {},
};

// DOM init
const DOM: Record<string, any> = {};

const webglMove = function (app: any) {
  app.call("changeStatus", ["init"], "webgl");
  app.call("moveScene", "", "webgl");
  app.call("appear", "", "webgl");
};
const onEnter = function (next?: any) {
  const container = next?.container ?? document;

  DOM.titles = [...container.querySelectorAll(".js-title")];
  gsap.set(container.querySelector(".js-title"), { autoAlpha: 1 });
  gsap.set("#js-background", { transformOrigin: "left" });

  DOM.titles.forEach((title: Element) => {
    charming(title, { tagName: "span", type: "word", nesting: 1, classPrefix: "word word" });
    charming(title, { tagName: "span", type: "letter", nesting: 2, classPrefix: "char char" });
  });
  gsap.to("#js-background", { x: "50%", scaleY: 1, autoAlpha: 1, scaleX: 1.1, duration: 1 });
  gsap.to(container.querySelectorAll(".js-title .char > span"), { y: "-10%", duration: 0.4, stagger: 0.015, delay: 0.6 });
  gsap.to(container.querySelector(".js-subtitle"), { autoAlpha: 1, duration: 1, delay: 1 });
  gsap.to(container.querySelector(".js-content"), { autoAlpha: 1, duration: 1, delay: 1 });
};

const homeTransition = (app: any) => {
  return [
    {
      name: "home-transition-play",
      sync: true,
      from: {
        namespace: ["play"],
      },
      to: {
        namespace: ["home"],
      },
      leave() {
        return Promise.all([
          app.call("disappear", "", "Gameoptions"),
          app.call("disappear", "", "Gameplayers", "me"),
          app.call("disappear", "", "Gameplayers", "rival"),
          app.call("disappear", "", "Gamecontrols"),
          app.call("disappear", "", "Gameboard"),
        ]);
      },
      enter({ next }: { next: any }) {
        onEnter(next);
        webglMove(app);
      },
    },
    {
      name: "home-transition-about",
      from: {
        namespace: ["about"],
      },
      to: {
        namespace: ["home"],
      },
      leave({ current }: { current: any }) {
        const prom = new Promise<void>((resolve) => {
          const titles = current.container.querySelectorAll(".js-title .char > span");
          const subtitles = current.container.querySelectorAll(".js-subtitle");
          const content = current.container.querySelectorAll(".js-content");
          if (titles) gsap.to(titles, { y: "100%", autoAlpha: 0, duration: 0.4 });
          if (subtitles) gsap.to(subtitles, { autoAlpha: 0, duration: 0.4 });
          if (content) gsap.to(content, { autoAlpha: 0, duration: 0.4, onComplete: () => resolve() });
        });
        return Promise.all([prom]);
      },
      enter({ next }: { next: any }) {
        onEnter(next);
      },
    },
    {
      name: "home-transition-dashboard",
      sync: true,
      from: {
        namespace: ["dashboard"],
      },
      to: {
        namespace: ["home"],
      },

      leave({ current }: { current: any }) {
        const prom = new Promise<void>((resolve) => {
          const dashboardheader = current.container.querySelector(".js-dashboardheader");
          const dashboard = current.container.querySelector(".js-dashboard");
          const dashboardArticle = current.container.querySelectorAll(".js-dashboard article");
          gsap.to(dashboardheader, { autoAlpha: 0, duration: 0.4 });
          gsap.to(dashboard, { "--sidepane": "100%" });
          gsap.to(dashboardArticle, { autoAlpha: 0, duration: 0.4, onComplete: () => resolve() });
        });
        return Promise.all([prom]);
      },
      enter({ next }: { next: any }) {
        onEnter(next);
        webglMove(app);
      },
    },
    {
      to: {
        namespace: ["home"],
      },
      once() {
        onEnter();
      },
    },
  ];
};

export { homeView, homeTransition };
