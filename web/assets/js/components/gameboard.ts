// @ts-nocheck
import { Component } from "sevejs";
import { gsap } from "gsap";
import { Chess } from "chess.js";

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

    this.DOM.cells = [...this.DOM.el.querySelectorAll("div")];
    this.DOM.moves = [];

    this.DOM.cells.forEach((el) => {
      this.on({ e: "click", target: el, cb: this.selectCell.bind(this) });
    });

    this._parseCells(this.color);
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
      return; // action
    }
    if (this.chess.isStalemate()) {
      console.log("isStalemate");

      return; // action
    }
    if (this.chess.isDraw()) {
      console.log("isDraw");

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
    const currentCell = e.currentTarget.dataset.cell;
    if (this.moves.includes(currentCell)) {
      // if click on allowed cell (to move)
      const move = this.chess.move({ from: this.selected, to: currentCell });
      if (move.captured) {
        // capture
        console.log(move.captured);
        this.call("capturePawn", [move.captured], "gameplayers", move.color === this.color ? "me" : "rival");
      }
      console.log(move);
      // ------ WS emmit my move ------
      this.engine();
      //reset allowed position
      gsap.set(this.DOM.moves, { color: "black" });
      this.DOM.moves = [];

      console.log(this.chess.board());
    } else {
      // if click on disallow cell (new select)
      if (this.DOM.moves.length > 0) {
        // if new select on board -> reset allowed position

        gsap.set(this.DOM.moves, { color: "black" });
        this.DOM.moves = [];
      }

      // get allowed position on board DOM then DOM
      this.selected = currentCell;
      this.moves = this.chess.moves({ square: currentCell, verbose: true }).map((pos) => pos.to);

      this.moves.forEach((cell) => {
        this.DOM.moves.push(this.DOM.el.querySelector(`[data-cell="${cell}"]`));
      });

      // highlight allowed position
      gsap.set(this.DOM.moves, { color: "red" });
    }
  }

  _parseCells(color: "w" | "b" = "w") {
    const alph = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const boardPositions = [];
    let i = alph.length;
    while (i > 0) {
      alph.forEach((letter) => boardPositions.push(letter + i));
      i--;
    }

    if (color === "black") {
      boardPositions.reverse();
    }

    this.DOM.cells.forEach((el, i) => {
      el.dataset.cell = boardPositions[i];
      el.innerHTML = boardPositions[i];
    });
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
