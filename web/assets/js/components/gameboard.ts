import { Component } from 'sevejs';
import { gsap } from 'gsap';
import { Chess } from 'chess.js';
import { type Colors, GameState, Promotion, Winner } from '../types/types';
import Actions from '../actions.ts';
function sleep(delay:number) {
  return new Promise((resolve) => setTimeout(resolve, delay))
}
const Gameboard = class extends Component {
  constructor(opts: any) {
    super(opts);
    this.events = {};
  }

  init() {
    console.log('PlayBoard component init');

    this.chess = new Chess();
    this.moves = [];
    this.promotion = [];
    this.allowedToMove = false;
    this.pomotionEvents = [];
    this.initMoveTimer = null;
    this.firstMove = true;
    this.rivalFirstMove = true;

    this.DOM.board = this.DOM.el.querySelector('#js-game');
    this.DOM.promotionBtns = [...this.DOM.el.querySelectorAll('.js-topromote')];
    this.DOM.moves = [];
    this.DOM.promoteModal = this.DOM.el.querySelector('#js-promote-modal');
    this.rivalTimeout;

    // @ts-ignore
    this.board = Chessboard(this.DOM.board, {
      pieceTheme: `/img/images/pieces/staunton/basic/{piece}.png`,
      onMoveEnd: this._onSnapEnd.bind(this),
      moveSpeed: 1
    });
    this.board.start();
  }

  _onSnapEnd() {
    this.board.position(this.chess.fen());
  }

  startGame(gameId: string, color: Colors) {
    this.gameState=null;
    this.gameId = gameId;
    this.color = color;
    if (this.color === 'b') this.board.flip();
    this.rivalColor = this.color === 'w' ? 'b' : 'w';

    this.DOM.cells = [...this.DOM.el.querySelectorAll('.square-55d63')];
    this.DOM.cells.forEach((el: Element, i: number) => {
      this.events[`cell-${i}`] = this.on({
        e: 'click',
        target: el,
        cb: this.selectCell.bind(this)
      });
    });
    this.setGameState();
  }

  showScoreBoard(winner: Colors) {
    gsap.set(this.DOM.el, { willChange: 'transform' });
    gsap.to(this.DOM.el, {
      rotate: winner === 'w' ? '-20deg' : '20deg',
      x: '60%',
      y: winner === 'w' ? '0%' : '25%',
      scale: 0.8
    });
  }

  getMoveNumber() {
    return this.chess.moveNumber();
  }
  async exitforFirstMove() {
    console.log('exitforTimeout called -> Ive not player under 30s');
    try {
      // Claim timeout. If no error, timeout succeeded
      const actions: Actions = await Actions.getInstance();
      await sleep(1000);
      await actions.claimTimeout(this.gameId);
      this.engine(false, GameState.ABORTED);
    } catch (e) {
      this.call('appear', ['Invalid claim timeout request', 'error'], 'toast');
      this.engine(false, GameState.ABORTED); //TODO: create a fail "exit" gameover in the engine
      // Timeout request is invalid
      // for the user (I assume fire event to end game)
    }
  }
  async engine(init = false, gameover?: GameState) {
    console.log('engine called');
    await this.setGameState(true); // get the latest state once off outside the interval
    
    console.log(this.gameState.state);

    if (
      this.gameState.state !== 'open' ||
      this.chess.isGameOver() ||
      gameover
    ) {
      console.log('GAME OVER!');

      const setFinalState = () => {
        clearTimeout(this.rivalTimeout);
        this.allowedToMove = false;
        this.call('stopTimer', [true], 'gameplayers', 'me');
        this.call('stopTimer', [true], 'gameplayers', 'rival');
        this.call('disappear', '', 'gamecontrols');
      };

      if (this.gameState.state === 'invalid') {
        throw new Error('invalid move');
      }

      console.log('gameState.state: ' + this.gameState.state);
      console.log('gameover: ' + gameover);
      clearTimeout(this.initMoveTimer);

      let status: GameState = GameState.CHECKMATED;

      if (
        gameover === GameState.ABORTED &&
        this.gameState.state === GameState.ABORTED
      ) {
        console.log('gameover for aborted');
        this.call('finishGame', ['Aborted', 'Aborted'], 'gameplayers', 'me');
        setFinalState();
      }

      if (
        gameover === GameState.TIMEOUT ||
        this.gameState.state === GameState.TIMEOUT
      ) {
        console.log('gameover for timeout');
        if (this.gameState.winner == 'none') {
          console.log('no winner -> abandon');
          this.call('finishGame', ['abandon', status], 'gameplayers', 'rival');
          setFinalState();
        } else {
          const valid = this.gameState.state == GameState.TIMEOUT;
          console.log('timeout with rival');
          const winnerColor =
            this.gameState.winner === Winner.BLACK ? 'b' : 'w';
          const amIwinner = winnerColor === this.color ? 'me' : 'rival';

          if (valid) {
            this.call(
              'finishGame',
              ['winner', 'timeout'],
              'gameplayers',
              amIwinner
            );
            setFinalState();
          }
        }
      }

      if (
        this.chess.isCheckmate() ||
        this.gameState.state === GameState.CHECKMATED
      ) {
        console.log('gameover for checkmate');

        const valid = this.gameState.state == GameState.CHECKMATED;

        const winnerColor = this.gameState.winner === Winner.BLACK ? 'b' : 'w';
        const amIwinner = winnerColor === this.color ? 'me' : 'rival';

        console.log('winnerColor :' + winnerColor);
        console.log('amIwinner :' + amIwinner);
        if (valid) {
          this.call(
            'finishGame',
            ['winner', this.gameState.state],
            'gameplayers',
            amIwinner
          );
          setFinalState();
        }
      }

      const isEngineDrawn =
        this.gameState.state === GameState.STALEMATE ||
        this.gameState.state === GameState.DRAWN_75_MOVE ||
        this.gameState.state === GameState.DRAWN_5_FOLD ||
        this.gameState.state === GameState.DRAWN_50_MOVE ||
        this.gameState.state === GameState.DRAWN_3_FOLD ||
        this.gameState.state === GameState.DRAWN_INSUFFICIENT ||
        this.gameState.state === GameState.DRAWN_BY_AGREEMENT;

      if (isEngineDrawn || this.chess.isDraw()) {
        console.log('gameover for draw');
        setFinalState();
        this.call(
          'finishGame',
          ['draw', this.gameState.state],
          'gameplayers',
          'me'
        );
      }

      if (this.gameState.state === GameState.RESIGNED) {
        console.log('gameover for resigned');
        setFinalState();
        this.call(
          'finishGame',
          ['winner', this.gameState.state],
          'gameplayers',
          'me'
        );
      }

      return;
    }
    //Remaining times in ms - Moved here to only update on turn change
    const whiteTimeRemaining = this.gameState.time.white_time;
    const blackTimeRemaining = this.gameState.time.black_time;
    if (this.color == 'w') {      
        this.call('setTimer', [whiteTimeRemaining/1000], 'gameplayers', 'me');      
        this.call(
          'setTimer',
          [blackTimeRemaining / 1000],
          'gameplayers',
          'rival'
        );
    } else {
        this.call('setTimer', [blackTimeRemaining / 1000], 'gameplayers', 'me');
        this.call(
          'setTimer',
          [whiteTimeRemaining / 1000],
          'gameplayers',
          'rival'
        );      
    }
    // Game turn update (player timer and action balancing)
    if (this.color === this.chess.turn()) {
      // My turn to play
      // If first move, 30s rule - no timer
      this.allowedToMove = true;
      this.call('stopTimer', [init], 'gameplayers', 'rival');

      // first call only if user is white
      if (this.firstMove) {
        console.log('first move');
        this.firstMove = false;
        const dateStartGame = this.gameState.time?.started_at;

        if (!dateStartGame) {
          throw new Error('No started_at game time');
        }

        // Get the time of creation & current time
        // Get the diff and use it to get the updated / sync timeout by substract by 30s

        //TODO: trying with 30s from browser perspective
        // -> becareful, this may be a sync issue & timout result with the server: not good
        // const startDate = new Date(dateStartGame);
        // const currentDate = new Date();
        // const diffDate = startDate.getTime() - currentDate.getTime();

        // TODO: trying with 30s from browser perspective
        
        const timer = 30 * 1000;

        this.initMoveTimer = setTimeout(async () => {
          await this.exitforFirstMove();
        }, timer); //30sec first move
      } else {
        this.call('startTimer', [this.gameId], 'gameplayers', 'me');
      }
    } else {
      // Rival turn to play
      // stop my 30s first move.
      // If less than 1 move it means rival 30s first move - no timer
      clearTimeout(this.initMoveTimer);
      this.call('stopTimer', [init], 'gameplayers', 'me');
      if (!this.rivalFirstMove) {
        this.call('startTimer', [this.gameId], 'gameplayers', 'rival');
      } else {
        this.rivalFirstMove = false;
      }
      this.allowedToMove = false;
      this.rivalMove();
    }
  }

  async setGameState(once = false) {
    console.log("Fetching game state");
    const actions: Actions = await Actions.getInstance();
    this.gameState = await actions.getGame(this.gameId);

    const ongoing = this.gameState.state == GameState.OPEN;

    if (!ongoing && !once) {
      console.log('game stopped');
      const state: GameState =
        this.rivalFirstMove || this.firstMove
          ? GameState.ABORTED
          : this.gameState.state;
      this.engine(false, state);
    } else {
      if (!once) setTimeout(() => { this.setGameState(); }, 500);
    }
  }
  async rivalMove() {
    console.log('get rival move');
    const actions: Actions = await Actions.getInstance();

    // let retryTimeout: NodeJS.Timeout;

    const checkRivalMove = async () => {
      console.log('checkRivalMove start');
      const gameState = await actions.getGame(this.gameId);
      // Hack to sanitize the fen returned by the realm
      const currentFen = new Chess(gameState.position.fen).fen();

      if (this.chess.fen() === currentFen) {
        // No changes, set up the next tick
        this.rivalTimeout = setTimeout(checkRivalMove, 500);
        console.log('same fen');
        return;
      }
      console.log('different fen');
      console.log(this.chess.fen());
      console.log(currentFen);

      clearTimeout(this.rivalTimeout);

      // Find the move that matches the current fen
      const moves = this.chess.moves({ verbose: true });
      const nextMove = moves.find((move: any) => move.after === currentFen);

      // Fallback to loading the fen if we can't find the move
      const move = nextMove
        ? this.chess.move(nextMove)
        : this.chess.load(currentFen);

      const chessFen: string = this.chess.fen();
      this.board.position(chessFen);

      if (move?.captured) {
        this.call(
          'capturePawn',
          [move.captured],
          'gameplayers',
          move.color === this.color ? 'me' : 'rival'
        );
      }
      console.log('engine called here');
      await this.engine();
    };

    this.rivalTimeout = setTimeout(checkRivalMove, 0);
  }

  async promote(): Promise<Promotion> {
    // make popup appear
    gsap.to(this.DOM.promoteModal, { autoAlpha: 1 });

    // wait for user promote selection
    return new Promise((resolve) => {
      this.DOM.promotionBtns.forEach((el: Element) => {
        const cb = (e: any) => {
          this.pomotionEvents.forEach((event: any) => {
            this.off(event, evOpts);
          });

          gsap.to(this.DOM.promoteModal, { autoAlpha: 0 });

          // Return selection, remove event and close popup
          resolve(e.currentTarget.dataset.topromote as Promotion);
        };

        const evOpts = {
          e: 'click',
          target: el,
          cb: cb.bind(this)
        };

        const ev = this.on(evOpts);
        this.pomotionEvents.push(ev);
      });
    });
  }

  async selectCell(e: any) {
    //TODO: highlight selected pawn
    if (!this.allowedToMove) return;

    const actions: Actions = await Actions.getInstance();

    //only if player turn

    const currentCell = e.currentTarget.dataset.square;

    if (this.moves.includes(currentCell)) {
      this.moves = [];
      let promotion: Promotion = Promotion.NO_PROMOTION;

      //if promotion, wait for user choice
      if (this.promotion.length > 0) {
        this.DOM.board.style.pointerEvents = 'none';
        promotion = await this.promote();
        this.DOM.board.style.pointerEvents = 'auto';
      }

      // if click on allowed cell (to move)
      const move = this.chess.move({
        from: this.selected,
        to: currentCell,
        promotion: promotion
      });
      this.board.move(`${move.from}-${move.to}`);
      if (move.captured) {
        // capture
        this.call(
          'capturePawn',
          [move.captured],
          'gameplayers',
          move.color === this.color ? 'me' : 'rival'
        );
      }
      // ------ Action - emmit my move ------
      try {
        console.log('try move');

        await actions.makeMove(this.gameId, move.from, move.to, promotion);
        console.log('move succeed');

        this.engine(); // TODO @Alexis missing await?

        //reset allowed positions
        gsap.to('.chess-board [data-square]', { '--disp-opacity': 0 });
        this.DOM.moves = [];
      } catch (e) {
        console.log('move error');

        this.chess.undo(); //undo move in the headless Chess
        this.board.position(this.chess.fen(), false); //undo move on the board

        this.call('appear', [e + ' - try your move again.', 'error'], 'toast'); //display error
      }
    } else {
      // if click on disallow cell (new select)
      if (this.DOM.moves.length > 0) {
        // if new select on board -> reset allowed position

        gsap.to('.chess-board [data-square]', { '--disp-opacity': 0 });
        this.DOM.moves = [];
      }

      // get allowed position on board DOM then DOM
      this.selected = currentCell;
      const moves = this.chess.moves({ square: currentCell, verbose: true });
      this.moves = [...new Set(moves.map((pos: any) => pos.to))]; //remove duplicate of "to" (promotion ones)
      this.promotion = [
        ...new Set(
          moves
            .filter((move: any) => move.promotion)
            .map((move: any) => move.to)
        )
      ];

      this.moves.forEach((cell: Element) => {
        this.DOM.moves.push(
          this.DOM.el.querySelector(`[data-square="${cell}"]`)
        );
      });
      // highlight allowed position
      if (this.DOM.moves.length > 0)
        gsap.to(this.DOM.moves, { '--disp-opacity': 1 });
    }
  }

  appear() {
    gsap.to(this.DOM.el, { autoAlpha: 1, display: 'flex' });
    gsap.from('.piece-417db', { y: '-65%', ease: 'bounce.out', stagger: 0.03 });
    gsap.from('.piece-417db', { autoAlpha: 0, stagger: 0.03 }).then(() => {      
      this.engine(true);
    });
  }

  disappear() {
    gsap.to(this.DOM.el, { autoAlpha: 0 });
  }

  destroy() {
    console.log('gameboard destroyed');
    clearTimeout(this.initMoveTimer);
    clearTimeout(this.rivalTimeout);
    this.chess.clear();
    this.board.destroy();
    //wS deco
  }
};

export { Gameboard };
