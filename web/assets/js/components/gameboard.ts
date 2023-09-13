import { Component } from "sevejs";
import { gsap } from "gsap";
import { Chess } from "chess.js";
import { type Colors } from "../types/types";

const Gameboard = class extends Component {
  constructor(opts: any) {
    super(opts);
  }

  init() {
    console.log("PlayBoard component init");

    this.chess = new Chess();
    this.moves = [];
    this.allowedToMove = false;

    // @ts-ignore
    this.board = Chessboard(this.DOM.el, {
      pieceTheme: `/img/images/pieces/staunton/basic/{piece}.png`,
      onMoveEnd: this._onSnapEnd.bind(this),
      moveSpeed: 1,
    });
    this.board.start();

    this.DOM.cells = [...this.DOM.el.querySelectorAll(".square-55d63")];
    this.DOM.moves = [];

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

  engine(init = false, gameover = false) {
    //TODO: -> remove -> for test purpose -> to et in if statment bellow
    // setTimeout(() => {
    //   this.call("finishGame", "gameover", "gameplayers", "me");
    //   this.call("stopTimer", [true], "gameplayers", "me");
    //   this.call("stopTimer", [true], "gameplayers", "rival");
    //   this.call("disappear", "", "gamecontrols");
    //   this.showScoreBoard("w");
    // }, 10000);

    if (this.chess.isGameOver() || gameover) {
      console.log("game over");
      // todo check from server
      this.call("stopTimer", [true], "gameplayers", "me");
      this.call("stopTimer", [true], "gameplayers", "rival");
      this.call("disappear", "", "gamecontrols");

      // TODO: improve facto
      if (gameover) {
        // for timeout
        if (this.color === this.chess.turn()) {
          this.call("finishGame", "gameover", "gameplayers", "me");
        } else {
          this.call("finishGame", "gameover", "gameplayers", "rival");
        }
      }

      if (this.chess.isStalemate()) {
        console.log("isStalemate");
      }
      if (this.chess.isDraw()) {
        console.log("isDraw");
      }
      if (this.chess.isThreefoldRepetition()) {
        console.log("isThreefoldRepetition");
      }
      if (this.chess.isInsufficientMaterial()) {
        console.log("isInsufficientMaterial");
      }
      if (this.chess.isCheckmate()) {
        console.log("isCheckmate");
      }

      //TODO: -> call endgame
      return; // action
    }

    if (this.color === this.chess.turn()) {
      this.call("stopTimer", [init], "gameplayers", "rival");
      this.call("startTimer", [init], "gameplayers", "me");
      this.allowedToMove = true;
    } else {
      this.call("stopTimer", [init], "gameplayers", "me");
      this.call("startTimer", [init], "gameplayers", "rival");
      this.allowedToMove = false;
    }
    //1 blanc -> je commande
    // call timer
    // je select
    // je move
    // envoie de la data
    //checkmate / gameover / pad
    //stop timer
    // changement turn (if turn === color) -> je peux select et move
    // call timer
    // wait du WS
    // hook des que coup recu
    // -> auto move (et incidence -)
    // ->
    // stop timer
    //checkmate / gameover / pad
  }

  rivalMove() {
    //TODO: listen action from WS rival
  }

  selectCell(e: any) {
    //TODO: highlight selected pawn
    const currentCell = e.currentTarget.dataset.square;
    if (this.moves.includes(currentCell)) {
      // if click on allowed cell (to move)
      const move = this.chess.move({ from: this.selected, to: currentCell, promotion: "q" });
      this.board.move(`${move.from}-${move.to}`);
      if (move.captured) {
        // capture
        this.call("capturePawn", [move.captured], "gameplayers", move.color === this.color ? "me" : "rival");
      }
      // ------ WS emmit my move ------
      this.engine();
      //reset allowed position
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
      this.moves = this.chess.moves({ square: currentCell, verbose: true }).map((pos: any) => pos.to);
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
