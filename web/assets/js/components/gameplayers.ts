import { Component } from 'sevejs';
import { gsap } from 'gsap';
import { truncateString } from '../utils/truncate';
import { type Colors } from '../types/types';

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

  config(time: number[], color: Colors, token = '', category: string) {
    //-- config game --
    //config token + type
    this.DOM.token.innerHTML = truncateString(token, 4, 4);
    this.color = color;
    this.category = category;

    //config timer
    this.increment = time[1];
    this.timer = time[0] * 60; //min to sec
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

  startTimer() {
    clearInterval(this.clock);

    this.timerActive = true;

    const clockAction = () => {
      this.timer--;
      this._createTime(this.timer);

      if (this.timer <= 0) {
        clearInterval(this.clock);
        this.DOM.timer.innerHTML = `00:00`;
        this.call('engine', ['timeout'], 'gameboard'); // let engine know timer is finished
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

  finishGame() {
    this.DOM.el.querySelector('.js-playergametype').innerHTML = this.category;
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
