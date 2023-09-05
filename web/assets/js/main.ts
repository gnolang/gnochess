import { App } from "sevejs";
import * as components from "./components";

window.addEventListener("load", function () {
  const app = new App({ components });
  app.init(app);
});
