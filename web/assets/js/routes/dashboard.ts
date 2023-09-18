import { gsap } from "gsap";

const dashboardView = {
  namespace: "dashboard",
  beforeEnter() {},
  afterEnter() {},
};

// DOM init
const dashboardTransition = (app: any) => {
  return [
    {
      name: "dashboard-transition",
      leave({ current }: { current: any }) {
        const prom = new Promise<void>((resolve) => {
          const titles = current.container.querySelectorAll(".js-title  .char > span");
          const subtitles = current.container.querySelectorAll(".js-subtitle");
          const content = current.container.querySelectorAll(".js-content");
          if (titles) gsap.to(titles, { y: "100%", autoAlpha: 0, duration: 0.4 });
          if (subtitles) gsap.to(subtitles, { autoAlpha: 0, duration: 0.4 });
          if (content) gsap.to(content, { autoAlpha: 0, duration: 0.4, onComplete: () => resolve() });
        });
        return Promise.all([
          app.call("disappear", "", "Gameoptions"),
          app.call("disappear", "", "Gameplayers", "me"),
          app.call("disappear", "", "Gameplayers", "rival"),
          app.call("disappear", "", "Gamecontrols"),
          app.call("disappear", "", "Gameboard"),
          app.call("disappear", "", "gamecategory"),
          app.call("disappear", true, "webgl"),
          gsap.to("#js-background", { autoAlpha: 1, x: "105%", scaleX: 1 }),
          prom,
        ]);
      },
      enter() {
        app.call("disappear", true, "webgl");
        gsap.to(".js-dashboardheader", { autoAlpha: 1 });
        gsap.to(".js-dashboard", { "--sidepane": 0 });
        gsap.to(".js-dashboard article", { autoAlpha: 1, y: 0, stagger: 0.05 });
      },
    },
    {
      to: {
        namespace: ["dashboard"],
      },
      once() {
        app.call("changeStatus", "none", "webgl");

        app.call("disappear", true, "webgl");
        gsap.to(".js-dashboardheader", { autoAlpha: 1 });
        gsap.to(".js-dashboard", { "--sidepane": 0 });
        gsap.to(".js-dashboard article", { autoAlpha: 1, y: 0, stagger: 0.05 });
      },
    },
  ];
};

export { dashboardView, dashboardTransition };
