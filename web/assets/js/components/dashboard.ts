import { Component } from "sevejs";
import Action from "../actions";

const Dashboard = class extends Component {
  constructor(opts: any) {
    super(opts);
  }

  init() {
    // automatically called at start
    console.log("Dashboard component init");
    //test
    Action.getUserData(); //test getUserData Action from Gno-client

    //TODO: login/logout - redir
    //TODO: feed data contents - personal
    //TODO: feed data contents - leaderboard (dedicated component ?)
  }

  destroy() {
    //TODO: deco from wallet
  }
};

export { Dashboard };
