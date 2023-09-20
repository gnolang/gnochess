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

  async init() {
    // automatically called at start
    console.log('Dashboard component init');

    //TODO: login/logout - redir + deco wallet (in destroy)

    Actions.getInstance()
      .then(async (actions: Actions) => {
        const userToken = actions.getFaucetToken();
        if (!userToken) {
          // TODO handle
          throw new Error('user token not present');
        }

        this.userToken = userToken;
        this._feedUser(this.userToken);

        const player = await actions.getUserData();
        this._feedRatings(player);
        this._feedPosition(player);
        this._feedLeaderbord();
      })
      .catch(() => {
        console.error('Error: Dashboard component init issue');
        // TODO handle error
      });
  }

  private _feedUser(token: string) {
    //avatar
    const bg = document.createElement('DIV');
    bg.style.filter = `brightness(${avatarize(token)}`;
    bg.className = 'avatar_bg';
    this.DOM.el.querySelector('.js-playeravatar').appendChild(bg);

    //token
    const DOM = document.getElementById('js-dashtoken');
    if (DOM && token) DOM.innerHTML = truncateString(token, 4, 4);
  }

  private _feedPosition(player: any) {
    this.DOM.el.querySelector('#js-dashboardPosition').innerHTML =
      player.position;
    this.DOM.el.querySelector('#js-dashboardScore').innerHTML = player.score;
  }

  private _createDomFunc(category: Categoy, rating: any) {
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

  private async _feedUserRating(player: any) {
    //TODO: Should Player type after
    const { wins, loses, draws } = player;
    const rating = {
      wins,
      loses,
      draws
    };
    return this._createDomFunc('Rapid', rating);
  }

  private _feedUserGlobalRating(globalRating: any) {
    return this._createDomFunc('Global', globalRating);
  }

  private async _feedRatings(player: any) {
    //Shoud be Player type after
    this._feedUserRating(player);

    const percents = this._createPie(player);
    this._feedUserGlobalRating(percents);
  }

  private _createPie(player: any) {
    //TODO: should be player type
    //TODO: refactor to get interactive chart
    const { wins, loses, draws } = player;
    const total = wins + loses + draws;
    console.log(total);
    const calc = (i: number) => Math.round((i / total) * 100);
    const percents = [calc(wins), calc(loses), calc(draws)];
    const pieEl = this.DOM.el.querySelector('#dashboard-rank');
    pieEl.style.background = `conic-gradient(#777777 0% ${percents[0]}%, #b4b4b4 ${percents[0]}% ${percents[1]}%, #d9d9d9 ${percents[1]}% ${percents[2]}%)`;
    pieEl.innerHTML = `<span class="dashbord-global-rank-value">${percents[0]}<span class="text-200">%</span> <br><span class="text-300">Wins</span></span>`;

    return {
      wins: percents[0],
      loses: percents[1],
      draws: percents[2],
      games: total
    };
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
                  2,
                  2
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
