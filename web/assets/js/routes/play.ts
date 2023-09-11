import { gsap } from "gsap";

const playView = {
  namespace: "play",
  beforeEnter() {},
  afterEnter() {},
  beforeLeave() {},
};

const playTransition = (app: any) => {
  return {
    name: "play-transition",
    sync: true,
    leave({ current }: { current: any }) {
      return new Promise<void>((resolve) => {
        const titles = current.container.querySelectorAll(".js-title > .char > span");
        const subtitles = current.container.querySelectorAll(".js-subtitle");
        const content = current.container.querySelectorAll(".js-content");
        gsap.to(titles, { y: "100%", autoAlpha: 0, duration: 0.4 });
        gsap.to(subtitles, { autoAlpha: 0, duration: 0.4 });
        gsap.to(content, { autoAlpha: 0, duration: 0.4, onComplete: () => resolve() });
      });
    },
    enter() {
      gsap.to("#js-background", { scaleX: 1, duration: 1.2 });
      gsap.to("#js-background", { x: 0, autoAlpha: 1 });
      app.call("changeStatus", ["pending"], "webgl");
      app.call("moveScene", "", "webgl");
    },
    once() {
      app.call("changeStatus", ["pending"], "webgl");

      gsap.set("#js-background", { x: 0, scaleX: 1 });
      gsap.to("#js-background", { autoAlpha: 1 });
    },
    to: {
      namespace: ["play"],
    },
  };
};

export { playView, playTransition };
