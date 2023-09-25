import { Component } from 'sevejs';
import { truncateString } from '../utils/truncate';
import { avatarize } from '../utils/avatar';

import Actions from '../actions';
import { Player, PlayerRating, Rating } from '../types/types.ts';

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
          throw new Error('user token not present');
        }

        this.userToken = userToken;
        this._feedUser(this.userToken);

        try {
          const player: Player = await actions.getUserData();
          this._feedRatings(player);
          console.log(this._feedLeaderbord());
        } catch (e) {
          this.call(
            'appear',
            ['Error: Cannot retrieve data, try later', 'error'],
            'toast'
          );
        }
      })
      .catch(() => {
        console.error('Error: Dashboard component init issue');
        this.call(
          'appear',
          ['Connect your token to get your data', 'warning'],
          'toast'
        );
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

  private _createDomFunc(category: Categoy, rating: any) {
    const kinds = ['wins', 'draws', 'losses'];
    const games = document.getElementById(`js-dashboard${category}Games`);

    kinds.forEach((kind) => {
      const el = document.getElementById(
        `js-dashboard${category}${kind.charAt(0).toUpperCase() + kind.slice(1)}`
      );
      if (el) el.innerHTML = rating[kind].toString();
    });
    if (games)
      games.innerHTML = (rating.losses + rating.draws + rating.wins).toString();

    return rating;
  }

  private _feedUserRating(player: Player) {
    const playerRapidRating: PlayerRating = player.rapid;
    const playerBlitzRating: PlayerRating = player.blitz;

    const rapidRating = {
      wins: playerRapidRating.wins,
      losses: playerRapidRating.losses,
      draws: playerRapidRating.draws,
      games:
        playerRapidRating.wins +
        playerRapidRating.losses +
        playerRapidRating.draws
    };

    const blitzRating = {
      wins: playerBlitzRating.wins,
      losses: playerBlitzRating.losses,
      draws: playerBlitzRating.draws,
      games:
        playerBlitzRating.wins +
        playerBlitzRating.losses +
        playerBlitzRating.draws
    };

    this._createDomFunc('Rapid', rapidRating);
    this._createDomFunc('Blitz', blitzRating);

    return [rapidRating, blitzRating];
  }

  private _feedUserGlobalRating(globalRating: Rating) {
    return this._createDomFunc('Global', globalRating);
  }

  private async _feedRatings(player: Player) {
    const ratings = this._feedUserRating(player);

    const globalRating = ratings.reduce((acc, curr) => {
      curr.wins += acc.wins;
      curr.losses += acc.losses;
      curr.draws += acc.draws;
      curr.games += acc.games;

      return curr;
    });

    const percents = this._createPie(globalRating);
    this._feedUserGlobalRating(percents);
  }

  private _createPie(rate: Rating) {
    //TODO: refactor to get interactive chart
    const { wins, losses, draws, games } = rate;

    const calc = (i: number) => Math.round((i / games) * 100);
    const percents = [calc(wins), calc(losses), calc(draws)];

    const pieEl = this.DOM.el.querySelector('#dashboard-rank');
    pieEl.style.background = `conic-gradient(#777777 0% ${percents[0]}%, #b4b4b4 ${percents[0]}% ${percents[1]}%, #d9d9d9 ${percents[1]}% ${percents[2]}%)`;
    pieEl.innerHTML = `<span class="dashboard-global-rank-value">${percents[0]}<span class="text-200">%</span> <br><span class="text-300">Wins</span></span>`;

    return {
      wins: percents[0],
      losses: percents[1],
      draws: percents[2],
      games: games
    };
  }

  private async _feedLeaderbord() {
    Actions.getInstance()
      .then(async (actions: Actions) => {
        const leaderboard = await actions.getLeaderboard();

        const blitzRanking = leaderboard.sort(
          (a, b) => a.blitz.position - b.blitz.position
        );
        const rapidRanking = leaderboard.sort(
          (a, b) => a.rapid.position - b.rapid.position
        );
        const leaders = [blitzRanking, rapidRanking];

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
      })
      .catch(() => {
        console.error('Error: Dashboard method _feedLeaderbord issue');
        this.call(
          'appear',
          ['Error: Leaderboard unreachable, try again later', 'error'],
          'toast'
        );
      });
  }

  destroy() {}
};

export { Dashboard };
