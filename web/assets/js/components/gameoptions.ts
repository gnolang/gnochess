import { Component } from 'sevejs';
import { gsap } from 'gsap';
import { GameTime } from '../types/types.ts';
import Actions from '../actions.ts';

type Options = {
  token: string;
  category: 'rapid' | 'blitz';
  timer: GameTime;
};
type Events = Record<string, any>;

const Gameoptions = class extends Component {
  constructor(opts: any) {
    super(opts);
    this.states = [
      { name: 'token', panels: ['token'], ctrls: ['cross', 'Connection'] },
      { name: 'token', panels: ['game'], ctrls: ['arrow', 'Play'] }
    ];
    this.lookingForRival = false;
    this.currentState = 0;
    this.timer = 0;
    this.timers = {
      rapid: [
        {
          time: 10,
          increment: 0
        },
        {
          time: 10,
          increment: 5
        },
        {
          time: 15,
          increment: 10
        }
      ],
      blitz: [
        {
          time: 3,
          increment: 0
        },
        {
          time: 3,
          increment: 2
        },
        {
          time: 5,
          increment: 0
        },
        {
          time: 5,
          increment: 3
        }
      ]
    };

    this.options = {
      token: '',
      category: 'rapid',
      timer: {
        time: 10,
        increment: 0
      }
    } as Options;

    this.events = {} as Events;
  }

  init() {
    // automatically called at start
    console.log('PlayControls component init');

    //DOM

    this.DOM.paneConnection = this.DOM.el.querySelector('#js-connection');
    this.DOM.paneCategory = this.DOM.el.querySelector('#js-category');
    this.DOM.paneTimer = this.DOM.el.querySelector('#js-timer');
    this.DOM.paneLoader = this.DOM.el.querySelector('#js-paneloader');
    this.DOM.categoryBtns = [
      ...this.DOM.el.querySelectorAll('.js-categoryUpdate')
    ];
    this.DOM.categorySwitch = this.DOM.el.querySelector('#js-categorySwitch');
    this.DOM.timerBtns = [...this.DOM.el.querySelectorAll('.js-timerUpdate')];
    this.DOM.timerDisplay = this.DOM.el.querySelector('#js-timerdisplay');
    this.DOM.timerIncrement = this.DOM.el.querySelector('#js-timerincrement');
    this.DOM.ctrl0 = this.DOM.el.querySelector('#js-gameoptions-ctr0');
    this.DOM.ctrl1 = this.DOM.el.querySelector('#js-gameoptions-ctr1');

    //controls events
    //TODO: keybord press events
    this.events.clickOnCtrl0 = this.on({
      e: 'click',
      target: this.DOM.ctrl0,
      cb: this._clickOnCtrl0.bind(this)
    });
    this.events.clickOnCtrl1 = this.on({
      e: 'click',
      target: this.DOM.ctrl1,
      cb: this._clickOnCtrl1.bind(this)
    });

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
    this.switchAnimation1 = gsap
      .timeline({ paused: true })
      .to(this.DOM.paneConnection, {
        autoAlpha: 0,
        display: 'none',
        duration: 0.6
      })
      .to(this.DOM.paneCategory, {
        autoAlpha: 1,
        display: 'flex',
        duration: 0.6
      })
      .to(
        this.DOM.paneTimer,
        { autoAlpha: 1, display: 'flex', duration: 0.6 },
        '<'
      );

    this.switchAnimation2 = gsap
      .timeline({ paused: true })
      .to(this.DOM.paneCategory, {
        autoAlpha: 0,
        display: 'none',
        duration: 0.6
      })
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
    this.DOM.timerDisplay.innerHTML = this.options.timer[0];
    this.DOM.timerIncrement.innerHTML = this.options.timer[1];

    //checkstep
    Actions.getInstance().then((actions) => {
      // TODO @Alexis please check that the semantics are right here
      if (actions.getFaucetToken()) {
        this._clickOnCtrl1(null, true);
      }

      this.appear();
    });
  }

  _clickOnCtrl0() {
    this.currentState--;

    if (this.currentState === 1) {
      this.switchAnimation2.reverse();
      this.lookingForRival = false;
      //TODO: stop WS rival finding -> this.lookingForRival
    } else {
      this.call('goTo', ['/'], 'Router');
    }
  }

  async _clickOnCtrl1(_e: any, immediate = false) {
    this.currentState++;

    const actions: Actions = await Actions.getInstance();

    switch (this.currentState) {
      case 1: {
        this.options.token = this._inputToken();
        this.DOM.ctrl1.innerHTML = this.states[this.currentState].ctrls[1]; //todo: animation
        this.switchAnimation1[immediate ? 'progress' : 'play'](
          immediate ? 1 : 0
        );

        break;
      }
      case 2: {
        this.switchAnimation2.play();

        this.call('changeStatus', ['action'], 'webgl');
        this.call('moveScene', [''], 'webgl');

        //TODO: error system
        //setup game
        this.lookingForRival = true;
        const gameSetting = await actions.joinLobby(this.options.timer);
        console.log(gameSetting);
        console.log('Logging');

        //check if game has not been cancelled after the wait
        if (this.lookingForRival) {
          this.call('disappear', [], 'webgl');

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
            gsap.to('#js-background', { scale: 1.1 });
            this.call('appear', '', 'gameplayers', 'me');
            this.call('appear', '', 'gameplayers', 'rival');
            this.call('appear', '', 'gamecontrols');
            this.call('appear', '', 'gameboard');
            this.call('startGame', gameSetting.me.color, 'gameboard');
          });
        }

        break;
      }
      default:
    }
  }

  _inputToken() {
    const token =
      this.DOM.el.querySelector('#id-gameoptions-token').value || '';

    Actions.getInstance().then((actions) => {
      if (!actions.getFaucetToken()) {
        actions.setFaucetToken(token);
      }
    });

    return token;
  }

  _inputCategory() {
    const arry = [
      ...document.getElementsByName('category')
    ] as HTMLInputElement[];
    return arry.filter((el) => el.checked)[0].value;
  }

  _updateTimer(e: any, init?: number) {
    if (init !== undefined || null) {
      const index = init ?? 0;
      this.timer = index;
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

    this.DOM.timerDisplay.innerHTML = this.options.timer[0];
    this.DOM.timerIncrement.innerHTML = this.options.timer[1];
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

    return tl;
  }

  destroy() {
    for (const prop of Object.getOwnPropertyNames(this.options)) {
      delete this.options[prop];
    }
    this.switchAnimation1.kill();
    this.switchAnimation2.kill();
  }
};

export { Gameoptions };
