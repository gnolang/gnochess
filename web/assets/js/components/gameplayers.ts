import { Component } from 'sevejs';
import { gsap } from 'gsap';
import { truncateString } from '../utils/truncate';
import { type Colors, GameState, GameTime, GameType } from '../types/types';
import Actions from '../actions.ts';

const Gameplayers = class extends Component {
  constructor(opts: any) {
    super(opts);
    this.timerActive = false;
  }

  init() {
    // automatically called at start
    console.log('PlayPlay component init');

    this.player = this.DOM.el.dataset.componentId;
    this.DOM.timer = this.DOM.el.querySelector('.js-playertime');
    this.DOM.pawns = this.DOM.el.querySelector('.js-playercapturepawns');
    this.DOM.token = this.DOM.el.querySelector('.js-playertoken');
    this.DOM.avatar = this.DOM.el.querySelector('.js-playeravatar');
    this.DOM.content = this.DOM.el.querySelector('.js-playercontent');
  }

  appear() {
    gsap.to(this.DOM.el, { autoAlpha: 1, display: 'flex' });
  }

  disappear() {
    gsap.to('.player-info', { '--banner-x': '-100%' });
    return gsap.to(this.DOM.el, {
      autoAlpha: 0,
      display: 'none',
      duration: 0.8
    });
  }

  config(
    time: GameTime,
    color: Colors,
    address: string = '',
    category: GameType
  ) {
    console.log(time);
    //-- config game --
    //config token + type
    this.DOM.token.innerHTML = truncateString(address, 4, 4);
    this.color = color;
    this.category = category;

    //config timer
    this.increment = 0; //time.increment;
    this.timer = 70; //time.time * 60; //min to sec
    this._createTime(this.timer);

    //config pawn color
    gsap.set(this.DOM.avatar, {
      backgroundColor: color === 'b' ? '#777777' : '#FFFFFF'
    });
    gsap.set(this.DOM.content, {
      color: color === 'b' ? '#777777' : '#FFFFFF'
    });

    //config avatar
    //TODO: avatar custo (in utils)
  }

  _createTime(datetarget: number) {
    const pad = (n: number) => (n < 10 ? '0' : '') + n;

    const minutes = Math.floor(datetarget / 60);
    const seconds = Math.floor(datetarget % 60);
    this.DOM.timer.innerHTML = `${pad(minutes)}:${pad(seconds)}`;
  }

  async startTimer(gameId: string) {
    clearInterval(this.clock);
    const actions: Actions = await Actions.getInstance();

    this.timerActive = true;

    const clockAction = async () => {
      this.timer--;

      if (this.timer <= 0) {
        clearInterval(this.clock);
        this.DOM.timer.innerHTML = `00:00`;
        try {
          // Claim timeout. If no error, timeout succeeded
          await actions.claimTimeout(gameId);
          this.call('engine', [false, GameState.TIMEOUT], 'gameboard'); // let engine know timer is finished
          console.log('claimTimeout did  work for ' + gameId);
        } catch (e) {
          console.log('claimTimeout did not work for ' + gameId);
          this.call(
            'appear',
            ['Invalid claim timeout request', 'error'],
            'toast'
          );
          this.call('engine', [false, GameState.TIMEOUT], 'gameboard'); // let engine know timer is finished
          // Timeout request is invalid
          // for the user (I assume fire event to end game)
        }
      } else {
        this._createTime(this.timer);
      }
    };

    this.clock = setInterval(clockAction, 1000);
  }

  stopTimer(gameover = false) {
    clearInterval(this.clock);
    if (this.timerActive) {
      this.timer += !gameover ? this.increment : 0;
      this._createTime(this.timer);
    }
    this.timerActive = false;
  }

  capturePawn(pawn: string) {
    const pawnEl = document.createElement('DIV');
    pawnEl.style.backgroundImage = `url('/img/images/pieces/staunton/basic/${
      (this.color === 'b' ? 'w' : 'b') + pawn.toUpperCase()
    }.png')`;
    this.DOM.pawns.appendChild(pawnEl);
  }

  finishGame(type = 'Winner', status = GameState.CHECKMATED) {
    console.log('finishGame - type: ' + type + ' status: ' + status);
    const playergamegameovertitle = this.DOM.el.querySelector(
      '.js-playergamegameovertitle'
    );
    console.log('playergamegameovertitle ' + playergamegameovertitle);
    playergamegameovertitle.innerHTML = type;
    this.DOM.el.querySelector('.js-playergametype').innerHTML =
      this.category + ' - ' + status;
    this.DOM.el.querySelector('.js-playerpoints').innerHTML = `${this.call(
      'getMoveNumber',
      '',
      'gameboard'
    )} moves`;
    gsap
      .timeline()
      .set('.player-info', {
        '--banner-y': this.player === 'rival' ? 0 : '57.5%'
      })
      .to('.player-info', { '--banner-x': 0 })
      .to(
        this.DOM.el.querySelector('.js-playercontent'),
        { color: '#777777' },
        0
      )
      .to(this.DOM.el.querySelector('.js-playerfinish'), { autoAlpha: 1 }, 0.6)
      .to(
        this.DOM.el.querySelector('.js-playerwinner'),
        { autoAlpha: 1, scale: 1 },
        0.8
      );
  }

  destroy() {
    clearInterval(this.clock);
  }
};

export { Gameplayers };
