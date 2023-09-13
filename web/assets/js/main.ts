import { App } from "sevejs";
import { gsap } from "gsap";
import * as components from "./components";

window.addEventListener("load", function () {
  gsap.config({
    nullTargetWarn: false,
  });
  const app = new App({ components });
  app.init(app);
});
