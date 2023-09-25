import { Component } from 'sevejs';
import { truncateString } from '../utils/truncate';
import { avatarize } from '../utils/avatar';

import Actions from '../actions';
import { Category, Player, PlayerRating } from '../types/types.ts';

interface DashboardScore
  extends Pick<PlayerRating, 'wins' | 'losses' | 'draws'> {
  games: number;
}

const newDashboardScore = (rating: PlayerRating): DashboardScore => {
  return {
    wins: rating.wins,
    losses: rating.losses,
    draws: rating.draws,
    games: rating.wins + rating.losses + rating.draws
  };
};

const Dashboard = class extends Component {
  userAddress: string | null = null;

  constructor(opts: any) {
    super(opts);
  }

  async init() {
    // automatically called at start
    console.log('Dashboard component init');

    const actions = await Actions.getInstance();
    const address = await actions.getUserAddress();

    this.userAddress = address;
    this._feedUser(address);

    try {
      // Fetch player data
      const player: Player = await actions.getUserData();

      this._feedRatings(player);
      await this._feedLeaderboard();
    } catch (e) {
      // Will trigger even if the account
      // has not played a game yet
      console.error(e);
    }
  }

  private _feedUser(address: string) {
    //avatar
    const bg = document.createElement('DIV');
    bg.style.filter = `brightness(${avatarize(address)}`;
    bg.className = 'avatar_bg';
    this.DOM.el.querySelector('.js-playeravatar').appendChild(bg);

    // address
    const DOM = document.getElementById('js-dashtoken');
    if (DOM && address) DOM.innerHTML = truncateString(address, 4, 4);
  }

  private _createDomFunc(category: Category, rating: DashboardScore) {
    const setPlayerScore = (score: number, kind: string) => {
      const el = document.getElementById(
        `js-dashboard${category}${kind.charAt(0).toUpperCase() + kind.slice(1)}`
      );

      if (el) el.innerHTML = score.toString();
    };

    setPlayerScore(rating.wins, 'wins');
    setPlayerScore(rating.draws, 'draws');
    setPlayerScore(rating.losses, 'losses');

    const games = document.getElementById(`js-dashboard${category}Games`);
    if (games) games.innerHTML = rating.games.toString();
  }

  private _feedUserRating(player: Player): DashboardScore[] {
    const rapidRating: DashboardScore = newDashboardScore(player.rapid);
    const blitzRating: DashboardScore = newDashboardScore(player.blitz);

    this._createDomFunc(Category.RAPID, rapidRating);
    this._createDomFunc(Category.BLITZ, blitzRating);

    return [rapidRating, blitzRating];
  }

  private _feedUserGlobalRating(globalRating: DashboardScore) {
    return this._createDomFunc(Category.GLOBAL, globalRating);
  }

  private _feedRatings(player: Player) {
    const ratings: DashboardScore[] = this._feedUserRating(player);

    const globalRating: DashboardScore = ratings.reduce((acc, curr) => {
      curr.wins += acc.wins;
      curr.losses += acc.losses;
      curr.draws += acc.draws;
      curr.games += acc.games;

      return curr;
    });

    this._feedUserGlobalRating(this._createPie(globalRating));
  }

  private _createPie(rate: DashboardScore): DashboardScore {
    //TODO: refactor to get interactive chart

    const calc = (i: number) => Math.round((i / rate.games) * 100);
    const percents = [calc(rate.wins), calc(rate.losses), calc(rate.games)];

    const pieEl = this.DOM.el.querySelector('#dashboard-rank');
    pieEl.style.background = `conic-gradient(#777777 0% ${percents[0]}%, #b4b4b4 ${percents[0]}% ${percents[1]}%, #d9d9d9 ${percents[1]}% ${percents[2]}%)`;
    pieEl.innerHTML = `<span class="dashboard-global-rank-value">${percents[0]}<span class="text-200">%</span> <br><span class="text-300">Wins</span></span>`;

    return {
      wins: percents[0],
      losses: percents[1],
      draws: percents[2],
      games: rate.games
    };
  }

  private async _feedLeaderboard() {
    const actions = await Actions.getInstance();

    try {
      const blitzLeaderboard: Player[] = await actions.getLeaderboard(
        Category.BLITZ
      );
      const rapidLeaderboard: Player[] = await actions.getLeaderboard(
        Category.RAPID
      );

      const leaders: Player[][] = [blitzLeaderboard, rapidLeaderboard];

      const leaderMapped = leaders.map((leadMap: Player[]) => {
        return leadMap
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
    } catch (e) {
      console.error('Error: Dashboard method _feedLeaderboard issue', e);
      this.call(
        'appear',
        ['Error: Leaderboard unreachable, try again later', 'error'],
        'toast'
      );
    }
  }

  destroy() {}
};

export { Dashboard };
