import { Component } from "sevejs";
import barba from "@barba/core";

import { playView, playTransition } from "../routes/play.ts";
import { homeTransition, homeView } from "../routes/home.ts";
import { genericTransition, genericView } from "../routes/generic.ts";
import { aboutTransition, aboutView } from "../routes/about.ts";
import { dashboardTransition, dashboardView } from "../routes/dashboard.ts";

type RouterType = "views" | "transitions";

const Router = class extends Component {
  constructor(opts: any) {
    super(opts); // "opts" arg from constructor to super is a mandatory to share components across the app
  }

  init() {
    // automatically called at start
    this.loadedViews = [playView, homeView, aboutView, genericView, dashboardView];
    this.loadedTransition = [playTransition(this), ...homeTransition(this), ...aboutTransition(this), ...genericTransition(this), dashboardTransition(this)];
    this.views = [];
    this.transitions = [];

    this._updateModules();
    this._createModules("views", this.loadedViews);
    this._createModules("transitions", this.loadedTransition);

    barba.init({
      views: this.views,
      transitions: this.transitions,
    });

    barba.hooks.enter(() => {
      window.scrollTo(0, 0);
    });
  }

  goTo(href: string) {
    barba.go(href);
  }

  /**
   * BARBA MODULE CREATION
   * @param {string} type ['views'|'transitions']
   * @param {array} modules
   */
  _createModules(type: RouterType, modules = []) {
    modules.forEach((module) => this[type].push(module));
  }

  /**
   * INIT MODULES UPDATE (MODUJS across BARBAJS)
   */
  _updateModules() {
    this.loadedViews.forEach((loadedView: any) => {
      /** Check if barba after/before function exist then yes save it */
      const viewAfterFunc = loadedView.afterEnter ? loadedView.afterEnter : null;
      const viewBeforeFunc = loadedView.beforeLeave ? loadedView.beforeLeave : null;

      loadedView.beforeLeave = () => {
        viewBeforeFunc && viewBeforeFunc();

        // Other general actions...
      };

      /** init barba after function if exist then create Modularjs update func */
      loadedView.afterEnter = (data: any) => {
        viewAfterFunc && viewAfterFunc();

        // Global Emit
        this.trigger("pageLoad");

        // Other general actions...

        /** if not first load -> modularjs already init in general index.js */
        if (data.current.container) {
          this.call("destroy", data.current.container, "app");
          this.call("update", data.next.container, "app");
        }
      };
    });
  }

  destroy() {
    barba.destroy();
  }
};

export { Router };
