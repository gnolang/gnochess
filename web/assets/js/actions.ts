import {saveToLocalStorage} from "./utils/localstorage";
import {
    defaultFaucetTokenKey,
    defaultMnemonicKey,
    Game,
    type GameoverType,
    GamePromise,
    type GameSettings,
    GameTime,
    Player,
    Promotion
} from "./types/types";
import {GnoWallet, GnoWSProvider} from "@gnolang/gno-js-client";
import {generateMnemonic} from "./utils/crypto.ts";
import {BroadcastTxCommitResult, TransactionEndpoint} from "@gnolang/tm2-js-client";

// TODO move this out into an ENV variable that's loaded in
const wsURL: string = "ws://127.0.0.1:26657/websocket"
const chessRealm: string = "gno.land/r/gnochess"

/**
 * Actions is a singleton logic bundler
 * that is shared throughout the game.
 *
 * Always use as Actions.getInstance()
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
            throw new Error("invalid join lobby response")
        }

        // Magically parse the response
        const joinData: GamePromise = JSON.parse(joinDataRaw)

        // Wait to be matched with an opponent
        return await this.waitForGame(joinData.id)
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

    /**
     * Fetches the active game state. Should be called
     * within a loop and checked.
     * @param gameID the ID of the running game
     */
    public async getGame(gameID: string): Promise<Game> {
        const gameResponse: string = await this.provider?.evaluateExpression(
            chessRealm,
            `GetGame(${gameID})`
        ) as string

        // Parse the response
        return JSON.parse(gameResponse)
    }

    /**
     * Executes the move and returns the game state
     * @param gameID the ID of the game
     * @param from from position
     * @param to  to position
     * @param promotion promotion information
     */
    async makeMove(
        gameID: string,
        from: string,
        to: string,
        promotion: Promotion = Promotion.NO_PROMOTION,
    ): Promise<Game> {
        // Make the move
        const moveResponse: BroadcastTxCommitResult = await this.wallet?.callMethod(
            chessRealm,
            "MakeMove",
            [
                gameID,
                from,
                to,
                promotion.toString()
            ],
            TransactionEndpoint.BROADCAST_TX_COMMIT
        ) as BroadcastTxCommitResult

        // Parse the response from the node
        const moveDataRaw: string | null = moveResponse.deliver_tx.ResponseBase.Data
        if (!moveDataRaw) {
            throw new Error("invalid move response")
        }

        // Magically parse the response
        return JSON.parse(moveDataRaw)
    }

    /**
     * Returns a flag indicating if the game with the specified ID is over
     * @param gameID the ID of the running game
     * @param type the game-over state types
     */
    async isGameOver(gameID: string, type: GameoverType): Promise<boolean> {
        // Fetch the game state
        const game: Game = await this.getGame(gameID)

        return game.state === type
    }

    /**
     * Triggers the game draw process
     * @param gameID the ID of the running game
     */
    async requestDraw(gameID: string): Promise<Game> {
        // Make the request
        const drawResponse: BroadcastTxCommitResult = await this.wallet?.callMethod(
            chessRealm,
            "DrawOffer",
            [
                gameID,
            ],
            TransactionEndpoint.BROADCAST_TX_COMMIT
        ) as BroadcastTxCommitResult

        // Parse the response from the node
        const drawResponseRaw: string | null = drawResponse.deliver_tx.ResponseBase.Data
        if (!drawResponseRaw) {
            throw new Error("invalid draw response")
        }

        // Magically parse the response
        return JSON.parse(drawResponseRaw)
    }

    /**
     * Triggers the game resignation
     * @param gameID the ID of the running game
     */
    async requestResign(gameID: string): Promise<Game> {
        // Make the request
        const resignResponse: BroadcastTxCommitResult = await this.wallet?.callMethod(
            chessRealm,
            "Resign",
            [
                gameID,
            ],
            TransactionEndpoint.BROADCAST_TX_COMMIT
        ) as BroadcastTxCommitResult

        // Parse the response from the node
        const resignResponseRaw: string | null = resignResponse.deliver_tx.ResponseBase.Data
        if (!resignResponseRaw) {
            throw new Error("invalid resign response")
        }

        // Magically parse the response
        return JSON.parse(resignResponseRaw)
    }

    /**
     * Declines the draw for the game
     * @param gameID the ID of the running game
     */
    async declineDraw(gameID: string): Promise<Game> {
        // Make the request
        const declineResponse: BroadcastTxCommitResult = await this.wallet?.callMethod(
            chessRealm,
            "DrawRefuse",
            [
                gameID,
            ],
            TransactionEndpoint.BROADCAST_TX_COMMIT
        ) as BroadcastTxCommitResult

        // Parse the response from the node
        const declineResponseRaw: string | null = declineResponse.deliver_tx.ResponseBase.Data
        if (!declineResponseRaw) {
            throw new Error("invalid draw refuse response")
        }

        // Magically parse the response
        return JSON.parse(declineResponseRaw)
    }

    /**
     * Accepts the draw for the game
     * @param gameID the ID of the running game
     */
    async acceptDraw(gameID: string): Promise<Game> {
        // Make the request
        const acceptResponse: BroadcastTxCommitResult = await this.wallet?.callMethod(
            chessRealm,
            "Draw",
            [
                gameID,
            ],
            TransactionEndpoint.BROADCAST_TX_COMMIT
        ) as BroadcastTxCommitResult

        // Parse the response from the node
        const acceptResponseRaw: string | null = acceptResponse.deliver_tx.ResponseBase.Data
        if (!acceptResponseRaw) {
            throw new Error("invalid draw accept response")
        }

        // Magically parse the response
        return JSON.parse(acceptResponseRaw)
    }

    /****************
     * DASHBOARD
     ****************/

    /**
     * Fetches the current user player profile
     */
    async getUserData(): Promise<Player> {
        // Get the current player address
        const address: string = await this.wallet?.getAddress() as string

        // Return the player data
        return this.getPlayer(address)
    }

    /**
     * Fetches a list of all players,
     * ordered by their position in the leaderboard
     */
    async getLeaderboard(): Promise<Player[]> {
        const leaderboardResponse: string = await this.provider?.evaluateExpression(
            chessRealm,
            "Leaderboard()"
        ) as string

        // Parse the response
        return JSON.parse(leaderboardResponse)
    }

    /**
     * Fetches the player score data
     * @param playerID the ID of the player (can be address or @username)
     */
    async getPlayer(playerID: string): Promise<Player> {
        const playerResponse: string = await this.provider?.evaluateExpression(
            chessRealm,
            `GetPlayer(${playerID})`
        ) as string

        // Parse the response
        return JSON.parse(playerResponse)
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

export default Actions
