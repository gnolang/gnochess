// @ts-nocheck
import { Component } from "sevejs";
import { gsap } from "gsap";
import { Chess, ChessInstance, SQUARES } from "chess.js";
import { Chessground } from "chessground";
// import Chessboard from "@chrisoakman/chessboardjs";

type Colors = "w" | "b";
const Gameboard = class extends Component {
  constructor(opts: any) {
    super(opts);
  }

  init() {
    console.log("PlayBoard component init");

    this.chess = new Chess();
    this.moves = [];
    this.allowedToMove = false;

    this.board = Chessboard(this.DOM.el, {
      pieceTheme: `/img/images/pieces/staunton/basic/{piece}.png`,
      onMoveEnd: this.onSnapEnd.bind(this),
      moveSpeed: 1,
    });
    this.board.start();

    this.DOM.cells = [...this.DOM.el.querySelectorAll(".square-55d63")];
    this.DOM.moves = [];

    this.DOM.cells.forEach((el) => {
      this.on({ e: "click", target: el, cb: this.selectCell.bind(this) });
    });

    this._parseCells(this.color);
  }

  onSnapEnd() {
    this.board.position(this.chess.fen());
  }

  movePawn() {}

  startGame(color: Colors) {
    this.color = color;
    this.rivalColor = this.color === "w" ? "b" : "w";

    this.engine();
  }

  engine() {
    if (this.chess.isGameOver()) {
      console.log("game over");
      // todo check from server
      this.call("stopTimer", "", "gameplayers", "me");
      this.call("stopTimer", "", "gameplayers", "rival");

      //call endgame
      return; // action
    }
    if (this.chess.isStalemate()) {
      console.log("isStalemate");
      this.call("stopTimer", "", "gameplayers", "me");
      this.call("stopTimer", "", "gameplayers", "rival");

      return; // action
    }
    if (this.chess.isDraw()) {
      console.log("isDraw");
      this.call("stopTimer", "", "gameplayers", "me");
      this.call("stopTimer", "", "gameplayers", "rival");

      return; // action
    }

    if (this.color === this.chess.turn()) {
      this.call("stopTimer", "", "gameplayers", "rival");
      this.call("startTimer", "", "gameplayers", "me");
      this.allowedToMove = true;
    } else {
      this.call("stopTimer", "", "gameplayers", "me");
      this.call("startTimer", "", "gameplayers", "rival");
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

  rivalMove() {}

  selectCell(e) {
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
      this.moves = this.chess.moves({ square: currentCell, verbose: true }).map((pos) => pos.to);
      this.moves.forEach((cell) => {
        this.DOM.moves.push(this.DOM.el.querySelector(`[data-square="${cell}"]`));
      });

      // highlight allowed position
      gsap.to(this.DOM.moves, { "--disp-opacity": 1 });
    }
  }

  _parseCells(color: "w" | "b" = "w") {
    // const alph = ["a", "b", "c", "d", "e", "f", "g", "h"];
    // const boardPositions = [];
    // let i = alph.length;
    // while (i > 0) {
    //   alph.forEach((letter) => boardPositions.push(letter + i));
    //   i--;
    // }
    // if (color === "black") {
    //   boardPositions.reverse();
    // }
    // this.DOM.cells.forEach((el, i) => {
    //   el.dataset.cell = boardPositions[i];
    //   el.innerHTML = boardPositions[i];
    // });
    // ----------------------
  }

  appear() {
    gsap.to(this.DOM.el, { autoAlpha: 1, display: "flex" });
  }
  disappear() {}

  destroy() {
    //wS deco
  }
};

export { Gameboard };
