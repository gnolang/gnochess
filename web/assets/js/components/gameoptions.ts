import { Component } from 'sevejs';
import { gsap } from 'gsap';
import { GameTime, GameType } from '../types/types.ts';
import Actions from '../actions.ts';
import Events from '../utils/events.ts';

interface Options {
  token: string;
  category: GameType;
  timer: GameTime;
}

type Events = Record<string, any>;

interface State {
  name: string;
  panels: string[];
  ctrls: string[];
}

interface Timer {
  time: number;
  increment: number;
}

interface Timers {
  rapid: Timer[];
  blitz: Timer[];
}

const Gameoptions = class extends Component {
  private states: State[];
  private lookingForRival: boolean;
  private currentState: number;
  private timer: number;
  private readonly timers: Timers;
  private readonly options: Options;
  private readonly events: Events;
  private panelSize: number = 0;

  constructor(opts: any) {
    super(opts);

    this.states = [
      { name: 'token', panels: ['token'], ctrls: ['cross', 'Connection'] },
      { name: 'token', panels: ['game'], ctrls: ['arrow', 'Play'] }
    ];

    this.lookingForRival = false;
    this.currentState = 0;
    this.disabled = false;
    this.timer = 0;
    this.timers = {
      rapid: [
        // [10, 0],
        { time: 10, increment: 5 }
        // [15, 10]
      ],
      blitz: [
        // [3, 0],
        // [3, 2],
        { time: 5, increment: 0 }
        // [5, 3]
      ]
    };

    this.options = {
      token: '',
      category: GameType.RAPID,
      timer: {
        time: 10,
        increment: 5
      }
    };

    this.events = {} as Events;
  }

  private eventsConfig = {
    pressOnCtrl1: {
      e: 'keypress',
      target: document,
      cb: this._pressOnCtrl1.bind(this)
    },
    clickOnCtrl1: {
      e: 'click',
      target: document.querySelector('#js-gameoptions-ctr1'),
      cb: this._clickOnCtrl1.bind(this)
    },
    clickOnCtrl0: {
      e: 'click',
      target: document.querySelector('#js-gameoptions-ctr0'),
      cb: this._clickOnCtrl0.bind(this)
    }
  };

  init() {
    // automatically called at start
    console.log('PlayControls component init');

    //DOM
    this.DOM.paneConnection = this.DOM.el.querySelector('#js-connection');
    this.DOM.paneCategory = this.DOM.el.querySelector('#js-category');
    this.DOM.paneTimer = this.DOM.el.querySelector('#js-timer');
    this.DOM.paneLoader = this.DOM.el.querySelector('#js-paneloader');
    this.DOM.paneBtns = this.DOM.el.querySelector('#gameoptions-actions');
    this.DOM.screen2 = this.DOM.el.querySelector('#js-secondscreen');
    this.DOM.categoryBtns = [
      ...this.DOM.el.querySelectorAll('.js-categoryUpdate')
    ];
    this.DOM.categorySwitch = this.DOM.el.querySelector('#js-categorySwitch');
    this.DOM.timerBtns = [...this.DOM.el.querySelectorAll('.js-timerUpdate')];
    this.DOM.timerDisplay = this.DOM.el.querySelector('#js-timerdisplay');
    this.DOM.timerIncrement = this.DOM.el.querySelector('#js-timerincrement');
    this.DOM.ctrl1 = this.DOM.el.querySelector('#js-gameoptions-ctr1');

    //controls events
    this.events.clickOnCtrl0 = this.on(this.eventsConfig.clickOnCtrl0);
    this.events.clickOnCtrl1 = this.on(this.eventsConfig.clickOnCtrl1);
    this.events.pressOnCtrl1 = this.on(this.eventsConfig.pressOnCtrl1);

    //category events
    this.DOM.categoryBtns.forEach((categoryBtn: Element, i: number) => {
      this.events['clickOnCategory' + i] = this.on({
        e: 'change',
        target: categoryBtn,
        cb: this._updateCategory.bind(this)
      });
    });

    //timer events
    this.DOM.timerBtns.forEach((timerBtn: Element, i: number) => {
      this.events['clickOnTimer' + i] = this.on({
        e: 'click',
        target: timerBtn,
        cb: this._updateTimer.bind(this)
      });
    });

    //tl
    this.panelSize = this._getPanelSize();
    gsap.set(this.DOM.paneCategory, { display: 'none' });
    gsap.set(this.DOM.paneTimer, { display: 'none' });

    this.switchAnimation1 = gsap
      .timeline({ paused: true })
      .to(this.DOM.el, { height: this.panelSize, duration: 0.4 })
      .to(
        this.DOM.paneConnection,
        {
          autoAlpha: 0,
          display: 'none',
          duration: 0.4
        },
        '<'
      )
      .to(this.DOM.paneCategory, {
        autoAlpha: 1,
        display: 'flex',
        duration: 1
      })
      .to(
        this.DOM.paneTimer,
        { autoAlpha: 1, display: 'flex', duration: 1 },
        '<'
      );

    this.switchAnimation2 = gsap
      .timeline({ paused: true })
      .set(this.DOM.el, { height: this.panelSize })
      .to(
        this.DOM.paneCategory,
        {
          autoAlpha: 0,
          display: 'none',
          duration: 0.6
        },
        '<'
      )
      .to(
        this.DOM.paneTimer,
        { autoAlpha: 0, display: 'none', duration: 0.6 },
        '<'
      )
      .to(this.DOM.ctrl1, { autoAlpha: 0, duration: 0.6 }, '<')
      .to(this.DOM.paneLoader, {
        autoAlpha: 1,
        display: 'flex',
        duration: 0.6
      });

    //actions
    this.DOM.timerDisplay.innerHTML = this.options.timer.time;
    this.DOM.timerIncrement.innerHTML = this.options.timer.increment;

    //checkstep
    Actions.getInstance().then((actions) => {
      if (actions.getFaucetToken() && actions.hasWallet()) {
        this._clickOnCtrl1(null, true);
      }

      actions.getBalance().then((balance) => {
        if (!balance || balance == 0) {
          gsap.set(this.DOM.ctrl1, {
            background: '#D9D9D9',
            color: '#FFFFFF',
            boxShadow: '0px 0px 0px 0px rgba(255,255,255,0)',
            cursor: 'default'
          });
          this.DOM.ctrl1.innerHTML = 'insufficient funds';
          this.disabled = true; //Works but ideally button should not visually respond to clicking + "play" label switched to "insufficient funds"
        }
      });
      this.appear();
    });
  }

  private _getPanelSize() {
    const compStyles = window.getComputedStyle(this.DOM.el);
    return (
      this.DOM.screen2.getBoundingClientRect().height +
      this.DOM.paneBtns.getBoundingClientRect().height +
      parseInt(compStyles.getPropertyValue('padding-bottom').slice(0, -2)) +
      parseInt(compStyles.getPropertyValue('padding-top').slice(0, -2))
    );
  }

  private async _clickOnCtrl0() {
    this.currentState--;
    console.log(this.currentState);
    if (this.currentState < 0) this.call('goTo', ['/'], 'router');
    if (this.disabled === true) return;

    if (this.currentState === 1) {
      const actions: Actions = await Actions.getInstance();
      actions.quitLobby();

      this.switchAnimation2.reverse();
      this.lookingForRival = false;
    } else {
      this.call('goTo', ['/'], 'Router');
    }
  }

  private _pressOnCtrl1(e: any) {
    let keyCode = e.keyCode ? e.keyCode : e.which;

    if (keyCode === 13) {
      // call click function of the button if "enter" btn
      this._clickOnCtrl1(e);
    }
  }

  async _clickOnCtrl1(_e: any, immediate = false) {
    if (this.disabled === true) return;
    this.currentState++;

    const actions: Actions = await Actions.getInstance();

    switch (this.currentState) {
      case 1: {
        if (!immediate) {
          this.options.token = await this._inputToken();
          if (this.options.token === null) {
            this.currentState--;
            return;
          }
        }
        this.DOM.ctrl1.innerHTML = this.states[this.currentState].ctrls[1];

        this.switchAnimation1[immediate ? 'progress' : 'play'](
          immediate ? 1 : 0
        );

        break;
      }
      case 2: {
        this.currentState++;
        this.switchAnimation2.play();

        this.call('changeStatus', ['action'], 'webgl');
        this.call('moveScene', [''], 'webgl');

        //setup game
        this.lookingForRival = true;
        try {
          const gameSetting = await actions.joinLobby(this.options.timer);
          console.log('Logging');

          //check if game has not been cancelled after the wait
          if (this.lookingForRival) {
            this.call('disappear', [], 'webgl');
            this.call('setCategory', [this.options.category], 'gamecategory');

            this.disappear().then((_) => {
              this.call(
                'config',
                [
                  this.options.timer,
                  gameSetting.me.color,
                  gameSetting.me.id,
                  this.options.category
                ],
                'gameplayers',
                'me'
              );
              this.call(
                'config',
                [
                  this.options.timer,
                  gameSetting.rival.color,
                  gameSetting.rival.id,
                  this.options.category
                ],
                'gameplayers',
                'rival'
              );

              gsap.set('#js-background', { transformOrigin: 'center' });
              gsap.to('#js-background', { scale: 1.1, duration: 1.4 });
              this.call('appear', [], 'gamecategory');

              this.call('appear', '', 'gameplayers', 'me');
              this.call('appear', '', 'gameplayers', 'rival');
              this.call('appear', [gameSetting.game.id], 'gamecontrols');
              this.call(
                'startGame',
                [gameSetting.game.id, gameSetting.me.color],
                'gameboard'
              );
              this.call('appear', '', 'gameboard');
            });
          }
        } catch (e) {
          console.error(e);
          //timeout for UX if immediate error
          setTimeout(() => {
            this._clickOnCtrl0();
            this.lookingForRival = false;
            this.call(
              'appear',
              ['Left game lobby, try again.', 'warning'],
              'toast'
            );
            return;
          }, 10000);
        }

        break;
      }
      default:
    }
  }

  async _inputToken() {
    const token =
      this.DOM.el.querySelector('#id-gameoptions-token').value || '';
    gsap.to(this.DOM.ctrl1, { background: '#D9D9D9', color: '#FFFFFF' });
    this.DOM.ctrl1.innerHTML = 'Waiting...';
    this.disabled = true;
    const actions: Actions = await Actions.getInstance();
    let isTokenError = false;

    if (!actions.getFaucetToken()) {
      try {
        await actions.setFaucetToken(token);
        gsap.to(this.DOM.ctrl1, { background: '#FFF', color: '#000' });
      } catch (e) {
        console.error(e);
        isTokenError = true;
        this.DOM.el.querySelector('#id-gameoptions-token').value = '';
        this.DOM.ctrl1.innerHTML = 'Connection';
        this.call('appear', ['Invalid token', 'error'], 'toast');
      }
    }
    this.disabled = false;

    gsap.to(this.DOM.ctrl1, { background: '#FFF', color: '#000' });

    return isTokenError ? null : token;
  }

  _inputCategory(): GameType {
    const arry = [
      ...document.getElementsByName('category')
    ] as HTMLInputElement[];
    return arry.filter((el) => el.checked)[0].value as GameType;
  }

  _updateTimer(e: any, init?: number) {
    if (init) {
      this.timer = init ?? 0;
    } else {
      const dir: number = e
        ? e.currentTarget.dataset.ctrl === '+'
          ? 1
          : -1
        : 0;
      this.timer = Math.min(
        this.timers[this.options.category].length - 1,
        Math.max(0, this.timer + dir)
      );
    }

    this.options.timer = this.timers[this.options.category][this.timer];

    this.DOM.timerDisplay.innerHTML = this.options.timer.time;
    this.DOM.timerIncrement.innerHTML = this.options.timer.increment;
  }

  _updateCategory(e: any) {
    const cat = e.currentTarget.value === 'blitz';

    this.options.category = this._inputCategory();
    this._updateTimer('', 0);
    gsap.to('.gameoptions-sprite', {
      backgroundPosition: cat ? '100%' : '0',
      ease: 'steps(9)',
      duration: 0.4
    });

    gsap.to(this.DOM.categorySwitch, { x: cat ? '100%' : '0' });
    gsap.to('#js-categoryWord', { x: cat ? '-60%' : '-15%' });
  }

  appear() {
    gsap.to(this.DOM.el, { autoAlpha: 1 });
  }

  disappear() {
    const tl = gsap.timeline();
    tl.to('#gameoptions-actions', { autoAlpha: 0, duration: 0.3 });
    tl.to('.js-pane', { autoAlpha: 0, duration: 0.3 }, 0);
    tl.to(
      this.DOM.el,
      {
        autoAlpha: 0,
        height: 0,
        display: 'none',
        duration: 0.7
      },
      '<+.1'
    );

    // remove event keypress
    this.off(this.events.pressOnCtrl1, this.eventsConfig.pressOnCtrl1);

    return tl;
  }

  destroy() {
    this.switchAnimation1.kill();
    this.switchAnimation2.kill();
  }
};

export { Gameoptions };
