import { io } from "socket.io-client";
import { saveToLocalStorage, getFromLocalStorage } from "./utils/localstorage";

export default new (class {
  constructor() {
    //INFO: MVP -> May not be the best way to handle the gno-ts
    //INFO: global class instantied once at load (IIFE) and accessible through the app
    //TODO: -> Should it be a seve component to communicate within the system (subpub etc)?

    console.log("Gno-Client actions init");
    console.log(io); //WS
  }

  /**
   * Metods ex (public)
   */
  //tokens
  setToken(token: "string") {
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

  //...

  //close WS and Gno-Client
  destroy() {}
})();
