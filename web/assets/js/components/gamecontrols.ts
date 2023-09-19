import { Component } from 'sevejs';
import { gsap } from 'gsap';
import Events from '../utils/events';
import Actions from '../actions.ts';
import { Game, GameState, drawRequestTimer } from '../types/types.ts';

type Events = Record<string, any>;
type GameAction = 'void' | 'draw' | 'resign' | 'offer';
const Gamecontrols = class extends Component {
  constructor(opts: any) {
    super(opts);
    this.events = {} as Events;
  }

  init() {
    // automatically called at start
    console.log('PlayControls component init');

    //Vars
    this.action = 'void' as GameAction;
    this.pendingDraw = false;
    this.timer = 9;

    this.contents = {
      resign: {
        title: 'Resign',
        content: 'Do you really want to Resign the Match?',
        btn: 'Confirm'
      },
      draw: {
        title: 'Draw',
        content: 'Do you really want to offer a draw?',
        btn: 'Confirm'
      },
      offer: {
        title: 'Draw',
        content: 'You were offered a Draw. Do you accept?',
        btn: 'Agree'
      }
    };

    //DOM
    this.DOM.ctr0 = this.DOM.el.querySelector('#js-gamecontrols-ctr0');
    this.DOM.ctr1 = this.DOM.el.querySelector('#js-gamecontrols-ctr1');
    this.DOM.ctrConfirm = this.DOM.el.querySelector('#js-gamecontrols-confirm');
    this.DOM.paneValidation = this.DOM.el.querySelector('#js-validation');
    this.DOM.title = this.DOM.el.querySelector('.js-gamecontrols-title');
    this.DOM.content = this.DOM.el.querySelector('.js-gamecontrols-content');
    this.DOM.timer = this.DOM.el.querySelector(
      '#js-gamecontrols-confirm-timer'
    );
    this.DOM.ctrConfirmContent = this.DOM.el.querySelector(
      '#js-gamecontrols-confirm-content'
    );
    this.DOM.contentPane = this.DOM.el.querySelector('#js-gamecontrols-pane');
    this.DOM.waitingPane = this.DOM.el.querySelector('#js-gamecontrols-wait');

    //controls events
    this.events.clickOnCtr0 = this.on({
      e: 'click',
      target: this.DOM.ctr0,
      cb: this._clickOnCtr.bind(this, 'resign', true)
    });
    this.events.clickOnCtr1 = this.on({
      e: 'click',
      target: this.DOM.ctr1,
      cb: this._clickOnCtr.bind(this, 'draw', true)
    });
    this.events.clickOnConfirm = this.on({
      e: 'click',
      target: this.DOM.ctrConfirm,
      cb: this._clickOnConfirm.bind(this)
    });

    //async events
    Events.on('drawPropal', this._getDrawProposition.bind(this));

    //tl
    this.validationTL = gsap
      .timeline({ paused: true })
      .to(this.DOM.paneValidation, {
        autoAlpha: 1,
        height: 'auto',
        duration: 0.6
      });
    this.disableCtr0TL = this._disableBtn(this.DOM.ctr0);
    this.disableCtr1TL = this._disableBtn(this.DOM.ctr1);
    this.swithCtr0TL = this._switchIconBtn(this.DOM.ctr0);
    this.swithCtr1TL = this._switchIconBtn(this.DOM.ctr1);
    this.waitingTL = gsap
      .timeline({ paused: true })
      .to(this.DOM.contentPane, { autoAlpha: 0, duration: 0.6 })
      .to(this.DOM.waitingPane, { autoAlpha: 1, duration: 0.6 });
  }

  _disableBtn(btn: Element) {
    return gsap
      .timeline({ paused: true })
      .set(btn, { cursor: 'auto' })
      .to(btn, {
        background: '#D9D9D9',
        color: '#FFFFFF',
        boxShadow: '0px 0px 0px 0px rgba(255,255,255,0)'
      });
  }

  _switchIconBtn(btn: Element) {
    return gsap
      .timeline({ paused: true })
      .to(btn.querySelector('.js-icon'), { autoAlpha: 0 })
      .to(btn.querySelector('.js-cross'), { autoAlpha: 1 }, '<');
  }

  _updateContent(action: GameAction) {
    this.DOM.title.innerHTML = this.contents[action].title;
    this.DOM.content.innerHTML = this.contents[action].content;
    this.DOM.ctrConfirmContent.innerHTML = this.contents[action].btn;
  }

  _clickOnCtr(action: GameAction, direct: boolean) {
    if (this.action === 'void') {
      this._updateContent(action);
      this.action = action === 'offer' ? 'draw' : action;

      this[action === 'resign' ? 'disableCtr1TL' : 'disableCtr0TL'].play();
      this[action === 'resign' ? 'swithCtr0TL' : 'swithCtr1TL'].play();
      this.validationTL.play();
    } else if (this.action === action && direct) {
      if (this.pendingDraw) {
        // if pending draw refused
        this._declineOffer();
      }
      this.action = 'void';
      this[action === 'resign' ? 'disableCtr1TL' : 'disableCtr0TL'].reverse();
      this[action === 'resign' ? 'swithCtr0TL' : 'swithCtr1TL'].reverse();

      this.waitingTL.reverse();
      this.validationTL.reverse().then(() => {
        this.DOM.timer.innerHTML = this.timer;
        gsap.set(this.DOM.timer, { autoAlpha: 0, display: 'none' });
      });
    }
  }

  async _clickOnConfirm() {
    const actions: Actions = await Actions.getInstance();

    if (this.action === 'resign') {
      await actions.requestResign(this.gameId);
      this.call('goTo', ['/'], 'router');
    }
    if (this.action === 'draw') {
      if (this.pendingDraw) {
        clearInterval(this.pendingDraw);
        this.timer = 9;
        this.pendingDraw = null;
      } else {
        this.waitingTL.play();

        const game: Game = await actions.requestDraw(this.gameId);
        if (game.state === GameState.DRAWN_BY_AGREEMENT) {
          this.call('engine', [false, 'draw'], 'gameboard');
          this.waitingTL.reverse();
        }
      }
    }

    this.validationTL.reverse();

    this[
      this.action === 'resign' ? 'disableCtr1TL' : 'disableCtr0TL'
    ].reverse();
    this[this.action === 'resign' ? 'swithCtr0TL' : 'swithCtr1TL'].reverse();

    //TODO: link to game component to draw or quit
    this.action = 'void';
  }

  async _declineOffer() {
    const actions: Actions = await Actions.getInstance();

    await actions.declineDraw(this.gameId);
    clearInterval(this.pendingDraw);
    this.timer = drawRequestTimer;
    this.pendingDraw = null;
  }

  _getDrawProposition() {
    gsap.set(this.DOM.timer, { autoAlpha: 1, display: 'inline-block' });

    this.pendingDraw = setInterval(() => {
      this.timer--;
      this.DOM.timer.innerHTML = this.timer;

      if (this.timer <= 0) {
        this._clickOnCtr('draw', true);
        this.timer = drawRequestTimer;
      }
    }, 1000);
    this._clickOnCtr('offer', false);
    console.log('propal received');

    // TODO @Alexis is something supposed to happen here with Actions?
  }

  appear(gameId: string) {
    this.gameId = gameId;
    gsap.to(this.DOM.el, { autoAlpha: 1, display: 'flex' });
  }

  disappear() {
    return gsap.to(this.DOM.el, {
      autoAlpha: 0,
      display: 'none',
      duration: 0.8
    });
  }

  destroy() {
    Events.off('drawPropal');
    clearInterval(this.pendingDraw);
    this.validationTL.kill();
    this.disableCtr0TL.kill();
    this.disableCtr1TL.kill();
    this.swithCtr0TL.kill();
    this.swithCtr1TL.kill();
  }
};

export { Gamecontrols };
