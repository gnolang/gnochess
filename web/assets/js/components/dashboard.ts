import { Component } from "sevejs";
import { truncateString } from "../utils/truncate";

import Actions from "../actions";

const Dashboard = class extends Component {
  userToken: string | undefined | null;
  constructor(opts: any) {
    super(opts);
  }

  init() {
    // automatically called at start
    console.log("Dashboard component init");

    //TODO: login/logout - redir
    //TODO: feed data contents - personal
    //TODO: feed data contents - leaderboard (dedicated component ?)
    //TODO: facto feed functions

    this.userToken = Actions.getToken() ?? null;
    this._feedUser(this.userToken);
    this._feedRatings();
    this._feedLeaderbord();
  }

  _feedUserSocial() {}
  _feedUser(token: string) {
    //avatar
    //TODO: avatar creation

    //token
    const DOM = document.getElementById("js-dashtoken");
    if (DOM && token) DOM.innerHTML = truncateString(token, 4, 4);
  }

  _feedUserBlitzRating() {
    const rating = Actions.getBlitzRating();
    const DOM = {
      wins: document.getElementById("js-dashboardBlitzWins"),
      draws: document.getElementById("js-dashboardBlitzDraws"),
      loses: document.getElementById("js-dashboardBlitzLoses"),
      games: document.getElementById("js-dashboardBlitzGames"),
    };
    if (DOM.wins) DOM.wins.innerHTML = rating.win.toString();
    if (DOM.draws) DOM.draws.innerHTML = rating.draws.toString();
    if (DOM.loses) DOM.loses.innerHTML = rating.lose.toString();
    if (DOM.games) DOM.games.innerHTML = (rating.lose + rating.draws + rating.win).toString();
    return rating;
  }

  _feedUserRapidRating() {
    const rating = Actions.getRapidRating();
    const DOM = {
      wins: document.getElementById("js-dashboardRapidWins"),
      draws: document.getElementById("js-dashboardRapidDraws"),
      loses: document.getElementById("js-dashboardRapidLoses"),
      games: document.getElementById("js-dashboardRapidGames"),
    };
    if (DOM.wins) DOM.wins.innerHTML = rating.win.toString();
    if (DOM.draws) DOM.draws.innerHTML = rating.draws.toString();
    if (DOM.loses) DOM.loses.innerHTML = rating.lose.toString();
    if (DOM.games) DOM.games.innerHTML = (rating.lose + rating.draws + rating.win).toString();
    return rating;
  }

  _feedUserGlobalRating(globalRating: any) {
    console.log(globalRating);

    const DOM = {
      wins: document.getElementById("js-dashboardGlobalWins"),
      draws: document.getElementById("js-dashboardGlobalDraws"),
      loses: document.getElementById("js-dashboardGlobalLoses"),
      games: document.getElementById("js-dashboardGlobalGames"),
    };

    if (DOM.wins) DOM.wins.innerHTML = globalRating.win.toString();
    if (DOM.draws) DOM.draws.innerHTML = globalRating.draws.toString();
    if (DOM.loses) DOM.loses.innerHTML = globalRating.lose.toString();
    if (DOM.games) DOM.games.innerHTML = (globalRating.lose + globalRating.draws + globalRating.win).toString();
    return globalRating;
  }

  async _feedRatings() {
    const ratings = await Promise.all([this._feedUserBlitzRating(), this._feedUserRapidRating()]);
    const globalRating = ratings.reduce((acc, curr) => {
      curr.win += acc.win;
      curr.lose += acc.lose;
      curr.draws += acc.draws;
      return curr;
    });
    this._feedUserGlobalRating(globalRating);
  }

  _feedLeaderbord() {
    const leaders = [Actions.getBlitzLeaders(), Actions.getRapidLeaders()];

    //TODO: check tailwind classes
    const leaderMapped = leaders.map((leadmap) => {
      return leadmap
        .map((lead: any) => {
          return `<li class="dashboard-avatar flex">
        <div class="bg-grey-200 w-20 overflow-hidde p-2"><img src="/img/mini-gopher.png" class="bg-grey-50 border border-grey-50 rounded-circle" alt="avatar" /></div>
        <div class="relative flex ml-4 pt-5 font-bold text-300 before:top-0 before:leading-tight before:absolute before:left-0 before:font-termina before:text-750 before:text-grey-150 items-center before:z-min z-1">
        ${truncateString(lead.token, 4, 4)}
        </div>
      </li>`;
        })
        .reduce((acc, curr) => acc + curr);
    });

    const DOMrapid = document.getElementById("js-dashrapidleaderboard");
    const DOMblitz = document.getElementById("js-dashblitzleaderboard");

    if (DOMblitz) DOMblitz.innerHTML = leaderMapped[0];
    if (DOMrapid) DOMrapid.innerHTML = leaderMapped[1];
  }

  destroy() {
    //TODO: deco from wallet
  }
};

export { Dashboard };
