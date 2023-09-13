import { Component } from "sevejs";
import { truncateString } from "../utils/truncate";

import Actions from "../actions";
type Categoy = "Blitz" | "Rapid" | "Global";

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

  _createDomFunc(category: Categoy, rating: any) {
    const kinds = ["wins", "draws", "loses", "game"];
    const games = document.getElementById(`js-dashboard${category}Games`);

    kinds.forEach((kind) => {
      const el = document.getElementById(`js-dashboard${category}${kind.charAt(0).toUpperCase() + kind.slice(1)}`);
      if (el) el.innerHTML = rating[kind].toString();
    });
    if (games) games.innerHTML = (rating.loses + rating.draws + rating.wins).toString();

    return rating;
  }

  async _feedUserBlitzRating() {
    const rating = await Actions.getBlitzRating();
    return this._createDomFunc("Blitz", rating);
  }
  async _feedUserRapidRating() {
    const rating = await Actions.getRapidRating();
    return this._createDomFunc("Rapid", rating);
  }
  _feedUserGlobalRating(globalRating: any) {
    return this._createDomFunc("Global", globalRating);
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
