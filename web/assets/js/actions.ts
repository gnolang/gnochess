import {io} from "socket.io-client";
import {getFromLocalStorage, saveToLocalStorage} from "./utils/localstorage";
import Events from "./utils/events";
import {
    type Colors,
    defaultFaucetTokenKey,
    defaultMnemonicKey,
    type GameoverType,
    GamePromise,
    type GameSettings,
    GameTime
} from "./types/types";
import {GnoWallet, GnoWSProvider} from "@gnolang/gno-js-client";
import {generateMnemonic} from "./utils/crypto.ts";
import {BroadcastTxCommitResult, TransactionEndpoint} from "@gnolang/tm2-js-client";

// TODO move this out into an ENV variable that's loaded in
const wsURL: string = "ws://127.0.0.1:26657/websocket"
const chessRealm: string = "gno.land/r/gnochess"

/**
 * Actions is a singleton logic bundler
 * that is shared throughout the game
 */
// @ts-ignore
class Actions {
    private static instance: Actions;

    private wallet: GnoWallet | null = null;
    private provider: GnoWSProvider | null = null;
    private faucetToken: string | null = null;

    private constructor() {
    }

    /**
     * Fetches the Actions instance. If no instance is
     * initialized, it initializes it
     */
    public static async getInstance(): Promise<Actions> {
        if (!Actions.instance) {
            Actions.instance = new Actions()

            await Actions.instance.initialize()
        }

        return Actions.instance
    }

    /**
     * Prepares the Actions instance
     * @private
     */
    private async initialize() {
        console.log("Gno-Client actions init");

        // Wallet initialization //

        // Try to load the mnemonic from local storage
        let mnemonic: string | null = localStorage.getItem(defaultMnemonicKey)
        if (!mnemonic || mnemonic === "") {
            // Generate a fresh mnemonic
            mnemonic = generateMnemonic()

            // Save the mnemonic to local storage
            saveToLocalStorage(defaultMnemonicKey, mnemonic)
        }

        // Initialize the wallet using the saved mnemonic
        this.wallet = await GnoWallet.fromMnemonic(mnemonic);

        // Initialize the provider
        this.provider = new GnoWSProvider(wsURL)

        // Connect the wallet to the provider
        this.wallet.connect(this.provider)

        // Faucet token initialization //
        let faucetToken: string | null = localStorage.getItem(defaultFaucetTokenKey)
        if (faucetToken && faucetToken !== "") {
            // Faucet token initialized
            this.faucetToken = faucetToken
        }
    }

    /**
     * Saves the faucet token to local storage
     * @param token the faucet token
     */
    public setFaucetToken(token: string) {
        this.faucetToken = token

        localStorage.setItem(defaultFaucetTokenKey, token)
    }

    /**
     * Fetches the saved faucet token, if any
     */
    public getFaucetToken(): string | null {
        return this.faucetToken
    }

    /****************
     * GAME ENGINE
     ****************/

    /**
     * Joins the waiting lobby for the game
     * @param time
     */
    public async joinLobby(time: GameTime): Promise<GameSettings> {
        return new Promise<GameSettings>(async (resolve, reject) => {
            try {
                // Join the waiting lobby
                const joinResponse: BroadcastTxCommitResult = await this.wallet?.callMethod(
                    chessRealm,
                    "JoinLobby", // TODO change when API is ready
                    [
                        time.time.toString(),
                        time.increment.toString()
                    ],
                    TransactionEndpoint.BROADCAST_TX_COMMIT
                ) as BroadcastTxCommitResult

                // Parse the response from the node
                const joinDataRaw: string | null = joinResponse.deliver_tx.ResponseBase.Data
                if (!joinDataRaw) {
                    reject("invalid join lobby response")

                    return
                }

                // Magically parse the response
                const joinData: GamePromise = JSON.parse(joinDataRaw)

                // Wait to be matched with an opponent
                const gameSettings: GameSettings = await this.waitForGame(joinData.id)

                resolve(gameSettings)
            } catch (e) {
                reject(e)
            }
        })
    }

    /**
     * Waits for the game with the specified ID to begin
     * @param id the ID of the game
     * @private
     */
    private async waitForGame(id: number): Promise<GameSettings> {
        return new Promise(async (resolve, reject) => {
            const exitTimeout = 15000; // wait time is max 15s

            const fetchInterval = setInterval(async () => {
                try {
                    // Check if the game is ready
                    const waitResponse: string = await this.provider?.evaluateExpression(
                        chessRealm,
                        `IsGameReady(${id})` // TODO change when API is ready
                    ) as string

                    // Parse the response
                    const gameSettings: GameSettings = JSON.parse(waitResponse)

                    resolve(gameSettings)
                } catch (e) {
                    // Game not ready, continue polling...
                }
            }, 1000);

            setTimeout(() => {
                // Clear the fetch interval
                clearInterval(fetchInterval)

                reject('wait timeout exceeded')
            }, exitTimeout)
        })
    }

    getRivalMove(chess: any, ia = false) {
        //TODO: error handling && check if chess types

        return new Promise<string>((resolve) => {
            if (ia) {
                const possibleMoves = chess.moves();
                const randomIdx = Math.floor(Math.random() * possibleMoves.length);
                setTimeout(() => resolve(possibleMoves[randomIdx]), 1000);
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

    requestDraw() {
        //TODO: error handling
        return new Promise<boolean>((resolve) => {
            setTimeout(() => resolve(false), 9000); //if not accepted --> may need a cleartimeout
        });
    }

    requestResign() {
        console.log("resign");
        // -- insert function here (eg. Resign(gameid))
        return true;
    }

    listenDraw() {
        setTimeout(() => {
            console.log("Draw proposition");
            //Could be a shared Symbol() id
            Events.emit("drawPropal");
        }, 8000);
    }

    declineDraw() {
        // -- insert function here
        console.log("draw refused");
    }

    acceptDraw() {
        // -- insert function here
        console.log("draw accepted");
    }

    /****************
     * DASHBOARD
     ****************/
    getUserData() {
        // example
        console.log("getUserData");
    }

    getUserScore() {
    }

    getLeaderbord() {
    }

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

    /**
     * Destroys the Actions instance, and closes any running services
     */
    public destroy() {
        if (!this.provider) {
            // Nothing to close
            return
        }

        // Close out the WS connection
        this.provider.closeConnection()
    }
}

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
        saveToLocalStorage(token, "token");
    }

    getToken() {
        return getFromLocalStorage("token");
    }

    /****************
     * GAME ENGINE
     ****************/
    createGame(timing: number[]) {
        //TODO: error handling
        //TODO: what if user quit game before creation?
        //-- use for tx NewGame(tx NewGame(opponent, timing[0], timing[1]))
        return new Promise<GameSettings>((resolve) => {
            console.log(timing);
            const mockedColor = ["w", "b"][Math.round(Math.random())];
            const mockedSettings: GameSettings = {
                me: {
                    color: mockedColor as Colors,
                    id: "glnaglnaglnaglnae558",
                },
                rival: {
                    color: mockedColor === "w" ? "b" : "w",
                    id: "grbqszfoiqefouqiz254",
                },
            };

            setTimeout(() => resolve(mockedSettings), 1000);
            this.listenDraw(); //TODO: remove this drawPoposition mockup call as well
        });
    }

    getRivalMove(chess: any, ia = false) {
        //TODO: error handling && check if chess types

        return new Promise<string>((resolve) => {
            if (ia) {
                const possibleMoves = chess.moves();
                const randomIdx = Math.floor(Math.random() * possibleMoves.length);
                setTimeout(() => resolve(possibleMoves[randomIdx]), 1000);
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

    requestDraw() {
        //TODO: error handling
        return new Promise<boolean>((resolve) => {
            setTimeout(() => resolve(false), 9000); //if not accepted --> may need a cleartimeout
        });
    }

    requestResign() {
        console.log("resign");
        // -- insert function here (eg. Resign(gameid))
        return true;
    }

    listenDraw() {
        setTimeout(() => {
            console.log("Draw proposition");
            //Could be a shared Symbol() id
            Events.emit("drawPropal");
        }, 8000);
    }

    declineDraw() {
        // -- insert function here
        console.log("draw refused");
    }

    acceptDraw() {
        // -- insert function here
        console.log("draw accepted");
    }

    /****************
     * DASHBOARD
     ****************/
    getUserData() {
        // example
        console.log("getUserData");
    }

    getUserScore() {
    }

    getLeaderbord() {
    }

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
    destroy() {
    }
})();
