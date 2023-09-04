import { App } from "sevejs";
import * as components from "./components";

const app = new App({ components });
app.init(app);
