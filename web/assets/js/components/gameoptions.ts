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
      category: 'rapid',
      timer: {
        time: 10,
        increment: 5
      }
    } as Options;

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

  private panelSize: number = 0;

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
      if (actions.getFaucetToken()) {
        this._clickOnCtrl1(null, true);
      }

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

    if (this.currentState === 1) {
      const actions: Actions = await Actions.getInstance();
      actions.quitLobby();

      this.switchAnimation2.reverse();
      this.lookingForRival = false;
      //TODO: stop WS rival finding -> this.lookingForRival
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
    this.currentState++;

    const actions: Actions = await Actions.getInstance();

    switch (this.currentState) {
      case 1: {
        this.options.token = await this._inputToken();
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

    const actions: Actions = await Actions.getInstance();

    if (!actions.getFaucetToken()) {
      await actions.setFaucetToken(token);
    }

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
    for (const prop of Object.getOwnPropertyNames(this.options)) {
      delete this.options[prop];
    }
    this.switchAnimation1.kill();
    this.switchAnimation2.kill();
  }
};

export { Gameoptions };
