import { io } from "socket.io-client";
import { saveToLocalStorage, getFromLocalStorage } from "./utils/localstorage";

export default new (class {
  constructor() {
    //INFO: MVP -> May not be the best way to handle the gno-ts
    //INFO: global class instantied once at load (IIFE) and accessible through the app
    //TODO: -> Should it be a seve component to communicate within the system (subpub etc)?

    //TODO: remove mocked data
    console.log("Gno-Client actions init");
    console.log(io); //WS
  }

  /**
   * Metods ex (public)
   */
  //tokens
  setToken(token: "string") {
    console.log("blabla");
    saveToLocalStorage(token, "token");
  }
  getToken() {
    return getFromLocalStorage("token");
  }

  //dashboard
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
