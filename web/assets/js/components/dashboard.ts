import { Component } from 'sevejs';
import { truncateString } from '../utils/truncate';
import { avatarize } from '../utils/avatar';

import Actions from '../actions';

type Categoy = 'Blitz' | 'Rapid' | 'Global';

const Dashboard = class extends Component {
  userToken: string | undefined | null;

  constructor(opts: any) {
    super(opts);
  }

  init() {
    // automatically called at start
    console.log('Dashboard component init');

    //TODO: login/logout - redir + deco wallet (in destroy)

    Actions.getInstance()
      .then((actions: Actions) => {
        const userToken = actions.getFaucetToken();
        if (!userToken) {
          // TODO handle
          throw new Error('user token not present');
        }

        this.userToken = userToken;
        this._feedUser(this.userToken);
        this._feedRatings();
        this._feedLeaderbord();
      })
      .catch(() => {
        // TODO handle error
      });
  }

  _feedUserSocial() {}

  _feedUser(token: string) {
    //avatar
    const bg = document.createElement('DIV');
    bg.style.filter = `brightness(${avatarize(token)}`;
    bg.className = 'avatar_bg';
    this.DOM.el.querySelector('.js-playeravatar').appendChild(bg);

    //token
    const DOM = document.getElementById('js-dashtoken');
    if (DOM && token) DOM.innerHTML = truncateString(token, 4, 4);
  }

  _createDomFunc(category: Categoy, rating: any) {
    const kinds = ['wins', 'draws', 'loses', 'game'];
    const games = document.getElementById(`js-dashboard${category}Games`);

    kinds.forEach((kind) => {
      const el = document.getElementById(
        `js-dashboard${category}${kind.charAt(0).toUpperCase() + kind.slice(1)}`
      );
      if (el) el.innerHTML = rating[kind].toString();
    });
    if (games)
      games.innerHTML = (rating.loses + rating.draws + rating.wins).toString();

    return rating;
  }

  _feedUserGlobalRating(globalRating: any) {
    return this._createDomFunc('Global', globalRating);
  }

  async _feedRatings() {
    const ratings = await Promise.all([
      this._feedUserBlitzRating(),
      this._feedUserRapidRating()
    ]);
    const globalRating = ratings.reduce((acc, curr) => {
      curr.wins += acc.wins;
      curr.loses += acc.loses;
      curr.draws += acc.draws;
      return curr;
    });
    this._createPie(globalRating);

    this._feedUserGlobalRating(globalRating);
  }

  _createPie(res: any) {
    //TODO: refactor to get interactive chart
    const total = res.wins + res.loses + res.draws;
    const calc = (i: number) => Math.round((i / total) * 100);
    const percents = [calc(res.wins), calc(res.loses), calc(res.draws)];
    const pieEl = this.DOM.el.querySelector('#dashboard-rank');
    pieEl.style.background = `conic-gradient(#777777 0% ${percents[0]}%, #b4b4b4 ${percents[0]}% ${percents[1]}%, #d9d9d9 ${percents[1]}% ${percents[2]}%)`;
    pieEl.innerHTML = `<span class="dashbord-global-rank-value">${percents[0]}<span class="text-200">%</span> <br><span class="text-300">Wins</span></span>`;
  }

  _feedLeaderbord() {
    // TODO @Alexis
    // There is no Blitz / Rapid leaderboard,
    // only the actual leaderboard that is fetch-able by
    // await Actions.getInstance().getLeaderboard()
    const leaders: any[] = [];

    //TODO: check tailwind classes
    const leaderMapped = leaders.map((leadmap) => {
      return leadmap
        .map((lead: any) => {
          avatarize(lead.token);
          return `<li class="dashboard-avatar">
                <div class="dashboard-avatar_img"><div class="dashboard-avatar_bg" style="filter: brightness(${avatarize(
                  lead.token
                )})"></div><img src="/img/mini-gopher.png" alt="avatar"/></div>
                <div class="dashboard-avatar_info">${truncateString(
                  lead.token,
                  4,
                  4
                )}</div>
          </li>`;
        })
        .reduce((acc: any, curr: any) => acc + curr);
    });

    const DOMrapid = document.getElementById('js-dashrapidleaderboard');
    const DOMblitz = document.getElementById('js-dashblitzleaderboard');

    if (DOMblitz) DOMblitz.innerHTML = leaderMapped[0];
    if (DOMrapid) DOMrapid.innerHTML = leaderMapped[1];
  }

  destroy() {}
};

export { Dashboard };
