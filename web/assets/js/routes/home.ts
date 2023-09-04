import { gsap } from "gsap";

const homeView = {
  namespace: "home",
  beforeEnter() {},
  afterEnter() {},
};

const homeTransition = {
  name: "play-transition",
  leave() {},
  enter() {
    const DOM = {
      background: document.getElementById("js-background"),
    };
    gsap.to(DOM.background, { x: "50%" });
  },
  once() {},
  to: {
    namespace: ["home"],
  },
};

export { homeView, homeTransition };
