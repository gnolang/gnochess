import { Component } from "sevejs";
import { gsap } from "gsap";
import { Chess } from "chess.js";
import { type Colors, type GameoverType } from "../types/types";
import Action from "../actions";

const Gameboard = class extends Component {
  constructor(opts: any) {
    super(opts);
  }

  init() {
    console.log("PlayBoard component init");

    this.chess = new Chess();
    this.moves = [];
    this.promotion = [];
    this.allowedToMove = false;
    this.pomotionEvents = [];

    this.DOM.board = this.DOM.el.querySelector("#js-game");
    this.DOM.promotionBtns = [...this.DOM.el.querySelectorAll(".js-topromote")];
    this.DOM.moves = [];
    this.DOM.promoteModal = this.DOM.el.querySelector("#js-promote-modal");

    // @ts-ignore
    this.board = Chessboard(this.DOM.board, {
      pieceTheme: `/img/images/pieces/staunton/basic/{piece}.png`,
      onMoveEnd: this._onSnapEnd.bind(this),
      moveSpeed: 1,
    });
    this.board.start();

    this.DOM.cells = [...this.DOM.el.querySelectorAll(".square-55d63")];
    this.DOM.cells.forEach((el: Element) => {
      this.on({ e: "click", target: el, cb: this.selectCell.bind(this) });
    });
  }

  _onSnapEnd() {
    this.board.position(this.chess.fen());
  }

  startGame(color: Colors) {
    this.color = color;
    this.rivalColor = this.color === "w" ? "b" : "w";
  }

  showScoreBoard(winner: Colors) {
    gsap.set(this.DOM.el, { willChange: "transform" });
    gsap.to(this.DOM.el, { rotate: winner === "w" ? "-20deg" : "20deg", x: "60%", y: winner === "w" ? "0%" : "25%", scale: 0.8 });
  }

  getMoveNumber() {
    return this.chess.moveNumber();
  }

  async engine(init = false, gameover?: GameoverType) {
    //for test purpose -> to et in if statment bellow
    // setTimeout(() => {
    //   this.call("finishGame", "gameover", "gameplayers", "me");
    //   this.call("stopTimer", [true], "gameplayers", "me");
    //   this.call("stopTimer", [true], "gameplayers", "rival");
    //   this.call("disappear", "", "gamecontrols");
    //   this.showScoreBoard("w");
    // }, 10000);

    if (this.chess.isGameOver() || gameover) {
      console.log("GAME OVER!");
      let status: GameoverType = "checkmate";

      if (gameover === "timeout") {
        status = "timeout";
        const valid = await Action.isGameover("timeout");
        if (valid) this.call("finishGame", ["winner", status], "gameplayers", this.color === this.chess.turn() ? "rival" : "me");
      }

      if (this.chess.isCheckmate()) {
        status = "checkmate";
        const valid = await Action.isGameover("timeout");
        if (valid) this.call("finishGame", ["winner", status], "gameplayers", this.color === this.chess.turn() ? "me" : "rival");
      }

      if (this.chess.isDraw() || gameover === "draw") {
        status = this.chess.isStalemate() ? "stalemate" : this.chess.isThreefoldRepetition() ? "threefoldRepetition" : this.chess.isInsufficientMaterial() ? "insufficientMaterial" : "draw";
        const valid = await Action.isGameover("timeout");
        if (valid) this.call("finishGame", ["draw", status], "gameplayers", "me");
      }

      this.call("stopTimer", [true], "gameplayers", "me");
      this.call("stopTimer", [true], "gameplayers", "rival");
      this.call("disappear", "", "gamecontrols");

      return; // action
    }

    //game turn update
    if (this.color === this.chess.turn()) {
      this.call("stopTimer", [init], "gameplayers", "rival");
      this.call("startTimer", [init], "gameplayers", "me");
      this.allowedToMove = true;
    } else {
      this.call("stopTimer", [init], "gameplayers", "me");
      this.call("startTimer", [init], "gameplayers", "rival");
      this.allowedToMove = false;
      this.rivalMove();
    }
  }

  rivalMove() {
    //TODO: listen action from WS rival - fake random IA now
    setTimeout(() => {
      const possibleMoves = this.chess.moves();
      const randomIdx = Math.floor(Math.random() * possibleMoves.length);
      const move = this.chess.move(possibleMoves[randomIdx]);
      this.board.position(this.chess.fen());

      if (move.captured) {
        this.call("capturePawn", [move.captured], "gameplayers", move.color === this.color ? "me" : "rival");
      }
      this.engine();
    }, 1000);
  }

  async promote(): Promise<string | number> {
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
          resolve(e.currentTarget.dataset.topromote);
        };

        const evOpts = {
          e: "click",
          target: el,
          cb: cb.bind(this),
        };

        const ev = this.on(evOpts);
        this.pomotionEvents.push(ev);
      });
    });
  }

  async selectCell(e: any) {
    //TODO: highlight selected pawn

    //only if player turn
    if (!this.allowedToMove) return;

    const currentCell = e.currentTarget.dataset.square;

    if (this.moves.includes(currentCell)) {
      this.moves = [];
      let promoted: string | number = 0;

      //if promotion, wwait for user choice
      if (this.promotion.length > 0) {
        this.DOM.board.style.pointerEvents = "none";
        promoted = await this.promote();
        this.DOM.board.style.pointerEvents = "auto";
      }

      // if click on allowed cell (to move)
      const move = this.chess.move({ from: this.selected, to: currentCell, promotion: promoted });
      this.board.move(`${move.from}-${move.to}`);
      if (move.captured) {
        // capture
        this.call("capturePawn", [move.captured], "gameplayers", move.color === this.color ? "me" : "rival");
      }

      // ------ Action - emmit my move ------
      await Action.makeMove(move.from, move.to, promoted);
      this.engine();

      //reset allowed positions
      gsap.to(".chess-board [data-square]", { "--disp-opacity": 0 });
      this.DOM.moves = [];
    } else {
      // if click on disallow cell (new select)
      if (this.DOM.moves.length > 0) {
        // if new select on board -> reset allowed position

        gsap.to(".chess-board [data-square]", { "--disp-opacity": 0 });
        this.DOM.moves = [];
      }

      // get allowed position on board DOM then DOM
      this.selected = currentCell;
      const moves = this.chess.moves({ square: currentCell, verbose: true });
      this.moves = [...new Set(moves.map((pos: any) => pos.to))]; //remove duplicate of "to" (promotion ones)
      this.promotion = [...new Set(moves.filter((move: any) => move.promotion).map((move: any) => move.to))];

      this.moves.forEach((cell: Element) => {
        this.DOM.moves.push(this.DOM.el.querySelector(`[data-square="${cell}"]`));
      });
      // highlight allowed position
      if (this.DOM.moves.length > 0) gsap.to(this.DOM.moves, { "--disp-opacity": 1 });
    }
  }

  appear() {
    gsap.to(this.DOM.el, { autoAlpha: 1, display: "flex" });
    gsap.from(".piece-417db", { y: "-65%", ease: "bounce.out", stagger: 0.03 });
    gsap.from(".piece-417db", { autoAlpha: 0, stagger: 0.03 }).then(() => {
      this.engine(true);
    });
  }
  disappear() {
    gsap.to(this.DOM.el, { autoAlpha: 0 });
  }

  destroy() {
    this.chess.clear();
    this.board.destroy();
    //wS deco
  }
};

export { Gameboard };
