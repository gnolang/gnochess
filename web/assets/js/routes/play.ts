import { gsap } from "gsap";

const playView = {
  namespace: "play",
  beforeEnter() {},
  afterEnter() {},
};

const playTransition = {
  name: "play-transition",
  leave() {},
  enter() {
    const DOM = {
      background: document.getElementById("js-background"),
    };
    gsap.to(DOM.background, { x: 0 });
  },
  once() {
    gsap.set("#js-background", { x: 0 });
  },
  to: {
    namespace: ["play"],
  },
};

export { playView, playTransition };
