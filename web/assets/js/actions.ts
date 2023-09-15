import { io } from "socket.io-client";
import { saveToLocalStorage, getFromLocalStorage } from "./utils/localstorage";
import { type GameoverType } from "./types/types";

export default new (class {
  constructor() {
    //INFO: MVP -> May not be the best way to handle the gno-ts
    //INFO: global class instantied once at load (IIFE) and accessible through the app
    //TODO: -> Should it be a seve component to communicate within the system (subpub etc)?

    //TODO: remove mocked data
    console.log("Gno-Client actions init");
    console.log(io); //WS
  }

  /****************
   * TOKEN
   ****************/
  setToken(token: "string") {
    console.log("blabla");
    saveToLocalStorage(token, "token");
  }
  getToken() {
    return getFromLocalStorage("token");
  }

  /****************
   * GAME ENGINE
   ****************/

  getRivalMove(chess: any, ia = false) {
    //TODO: error handling && check if chess types

    return new Promise<string>((resolve) => {
      if (ia) {
        const possibleMoves = chess.moves();
        const randomIdx = Math.floor(Math.random() * possibleMoves.length);
        setTimeout(() => resolve(possibleMoves[randomIdx]), 200);
      } else {
        //-- replace random IA above by WS function here
        resolve("INSERT_MOVE_HERE"); // `${from}-${to}` or `C3d2` notations
      }
    });
  }

  makeMove(from: string, to: string, promotion: string | number = 0) {
    //TODO: error handling
    // -- insert function here (eg. MakeMove(from, to, promotion))
    return new Promise<boolean>((resolve) => {
      console.log(from + " - " + to + " - " + promotion);
      setTimeout(() => resolve(true), 200);
    });
  }

  isGameover(type: GameoverType) {
    //check if gameover by type and return result
    //TODO: error handling
    // -- insert function here (eg. ClaimTimeout())
    return new Promise<boolean>((resolve) => {
      console.log(type);
      setTimeout(() => resolve(true), 200);
    });
  }

  /****************
   * DASHBOARD
   ****************/
  getUserData() {
    // example
    console.log("getUserData");
  }
  getUserScore() {}
  getLeaderbord() {}

  getBlitzRating() {
    return {
      loses: 13,
      wins: 0,
      draws: 2,
    };
  }

  getRapidRating() {
    return {
      loses: 2,
      wins: 13,
      draws: 1,
    };
  }

  getBlitzLeaders() {
    return [
      {
        token: "azerty1234",
      },
      {
        token: "qsdfgt765",
      },
      {
        token: "UJHFGVC565",
      },
      {
        token: "azerty1234",
      },
      {
        token: "qsdfgt765",
      },
      {
        token: "UJHFGVC565",
      },
      {
        token: "azerty1234",
      },
      {
        token: "qsdfgt765",
      },
      {
        token: "UJHFGVC565",
      },
      {
        token: "qsdfgt765",
      },
    ];
  }

  getRapidLeaders() {
    return [
      {
        token: "azerty1234",
      },
      {
        token: "qsdfgt765",
      },
      {
        token: "UJHFGVC565",
      },
      {
        token: "azerty1234",
      },
      {
        token: "qsdfgt765",
      },
      {
        token: "UJHFGVC565",
      },
      {
        token: "azerty1234",
      },
      {
        token: "qsdfgt765",
      },
      {
        token: "UJHFGVC565",
      },
      {
        token: "qsdfgt765",
      },
    ];
  }

  //...

  //close WS and Gno-Client
  destroy() {}
})();
