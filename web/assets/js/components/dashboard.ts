import { Component } from "sevejs";

const Dashboard = class extends Component {
  constructor(opts: any) {
    super(opts);
  }

  init() {
    // automatically called at start
    console.log("Dashboard component init");

    //TODO: login/logout - redir
    //TODO: feed data contents - personal
    //TODO: feed data contents - leaderboard (dedicated component ?)
  }

  destroy() {
    //TODO: deco from wallet
  }
};

export { Dashboard };
