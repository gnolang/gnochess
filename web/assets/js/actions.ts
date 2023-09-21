import { saveToLocalStorage } from './utils/localstorage';
import {
  defaultFaucetTokenKey,
  defaultMnemonicKey,
  drawRequestTimer,
  Game,
  type GameoverType,
  type GameSettings,
  GameState,
  GameTime,
  Player,
  Promotion
} from './types/types';
import { defaultTxFee, GnoWallet, GnoWSProvider } from '@gnolang/gno-js-client';
import {
  BroadcastTxCommitResult,
  TransactionEndpoint
} from '@gnolang/tm2-js-client';
import { generateMnemonic } from './utils/crypto.ts';
import Long from 'long';
import Config from './config.ts';

// ENV values //
const wsURL: string = Config.GNO_WS_URL;
const chessRealm: string = Config.GNO_CHESS_REALM;
const faucetURL: string = Config.FAUCET_URL;
const defaultGasWanted: Long = new Long(1000000); // 1M

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
  private isInTheLobby = false;

  private constructor() {}

  /**
   * Fetches the Actions instance. If no instance is
   * initialized, it initializes it
   */
  public static async getInstance(): Promise<Actions> {
    if (!Actions.instance) {
      Actions.instance = new Actions();

      await Actions.instance.initialize();
      return Actions.instance;
    } else {
      return Actions.instance;
    }
  }

  /**
   * Prepares the Actions instance
   * @private
   */
  private async initialize() {
    // Wallet initialization //

    // Try to load the mnemonic from local storage
    let mnemonic: string | null = localStorage.getItem(defaultMnemonicKey);
    if (!mnemonic || mnemonic === '') {
      // Generate a fresh mnemonic
      mnemonic = generateMnemonic();

      // Save the mnemonic to local storage
      saveToLocalStorage(defaultMnemonicKey, mnemonic);
    }

    // Initialize the wallet using the saved mnemonic
    this.wallet = await GnoWallet.fromMnemonic(mnemonic);

    // Initialize the provider
    this.provider = new GnoWSProvider(wsURL);

    // Connect the wallet to the provider
    this.wallet.connect(this.provider);

    // Faucet token initialization //
    let faucetToken: string | null = localStorage.getItem(
      defaultFaucetTokenKey
    );
    if (faucetToken && faucetToken !== '') {
      // Faucet token initialized
      this.faucetToken = faucetToken;

      // Attempt to fund the account
      await this.fundAccount();
    }
  }

  /**
   * Saves the faucet token to local storage
   * @param token the faucet token
   */
  public async setFaucetToken(token: string) {
    this.faucetToken = token;

    localStorage.setItem(defaultFaucetTokenKey, token);

    // Attempt to fund the account
    await this.fundAccount();
  }

  /**
   * Fetches the saved faucet token, if any
   */
  public getFaucetToken(): string | null {
    return this.faucetToken || localStorage.getItem(defaultFaucetTokenKey);
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
    await this.wallet?.callMethod(
      chessRealm,
      'LobbyJoin',
      [time.time.toString(), time.increment.toString()],
      TransactionEndpoint.BROADCAST_TX_COMMIT,
      undefined,
      {
        gasFee: defaultTxFee,
        gasWanted: defaultGasWanted
      }
    );

    try {
      // Wait to be matched with an opponent
      return await this.waitForGame();
    } catch (e) {
      // Unable to find the game, cancel the search
      await this.wallet?.callMethod(
        chessRealm,
        'LobbyQuit',
        [],
        TransactionEndpoint.BROADCAST_TX_COMMIT,
        undefined,
        {
          gasFee: defaultTxFee,
          gasWanted: defaultGasWanted
        }
      );

      // Propagate the error
      throw new Error('unable to find game');
    }
  }

  /**
   * Leave the waiting lobby for the game
   */
  public quitLobby() {
    this.isInTheLobby = false;
  }

  /**
   * Waits for the game to begin (lobby wait)
   * @param timeout the maximum wait time for a game
   * @private
   */
  private async waitForGame(timeout?: number): Promise<GameSettings> {
    this.isInTheLobby = true;
    return new Promise(async (resolve, reject) => {
      const exitTimeout = timeout ? timeout : drawRequestTimer * 1000; // wait time is max 15s

      const fetchInterval = setInterval(async () => {
        try {
          if (!this.isInTheLobby) reject('Leaved the lobby');

          // Check if the game is ready
          const lobbyResponse: BroadcastTxCommitResult =
            (await this.wallet?.callMethod(
              chessRealm,
              'LobbyGameFound',
              [],
              TransactionEndpoint.BROADCAST_TX_COMMIT,
              undefined,
              {
                gasFee: defaultTxFee,
                gasWanted: defaultGasWanted
              }
            )) as BroadcastTxCommitResult;

          // Parse the response
          const lobbyWaitResponse: string | null =
            lobbyResponse.deliver_tx.ResponseBase.Data;

          if (lobbyWaitResponse == null || lobbyWaitResponse == '') {
            return;
          }

          // Clear the fetch interval
          clearInterval(fetchInterval);

          // Parse the game data
          const game: Game = JSON.parse(lobbyWaitResponse as string);

          // Extract the game settings
          const isBlack: boolean =
            game.black == (await this.wallet?.getAddress());

          const gameSettings: GameSettings = {
            game: {
              id: game.id
            },
            me: {
              id: isBlack ? game.black : game.white,
              color: isBlack ? 'b' : 'w'
            },
            rival: {
              id: isBlack ? game.white : game.black,
              color: isBlack ? 'w' : 'b'
            }
          };

          resolve(gameSettings);
        } catch (e) {
          // Game not ready, continue polling...
        }
      }, 3000); // 3s, since it's an expensive call

      setTimeout(() => {
        this.isInTheLobby = false;

        clearInterval(fetchInterval);

        reject('wait timeout exceeded');
      }, exitTimeout);
    });
  }

  /**
   * Fetches the active game state. Should be called
   * within a loop and checked.
   * @param gameID the ID of the running game
   */
  public async getGame(gameID: string): Promise<Game> {
    const gameResponse: string = (await this.provider?.evaluateExpression(
      chessRealm,
      `GetGame(${gameID})`
    )) as string;

    // Parse the response
    return JSON.parse(gameResponse);
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
    promotion: Promotion = Promotion.NO_PROMOTION
  ): Promise<Game> {
    // Make the move
    const moveResponse: BroadcastTxCommitResult =
      (await this.wallet?.callMethod(
        chessRealm,
        'MakeMove',
        [gameID, from, to, promotion.toString()],
        TransactionEndpoint.BROADCAST_TX_COMMIT,
        undefined,
        {
          gasFee: defaultTxFee,
          gasWanted: defaultGasWanted
        }
      )) as BroadcastTxCommitResult;

    // Parse the response from the node
    const moveDataRaw: string | null =
      moveResponse.deliver_tx.ResponseBase.Data;
    if (!moveDataRaw) {
      throw new Error('invalid move response');
    }

    // Magically parse the response
    return JSON.parse(moveDataRaw);
  }

  /**
   * Returns a flag indicating if the game with the specified ID is over
   * @param gameID the ID of the running game
   * @param type the game-over state types
   */
  async isGameOver(gameID: string, type: GameoverType): Promise<boolean> {
    // Fetch the game state
    const game: Game = await this.getGame(gameID);

    return game.state === type;
  }

  /**
   * Triggers the game draw process
   * @param gameID the ID of the running game
   * @param timeout the requested timeout
   */
  async requestDraw(gameID: string, timeout?: number): Promise<Game> {
    // Make the request
    const drawResponse: BroadcastTxCommitResult =
      (await this.wallet?.callMethod(
        chessRealm,
        'DrawOffer',
        [gameID],
        TransactionEndpoint.BROADCAST_TX_COMMIT,
        undefined,
        {
          gasFee: defaultTxFee,
          gasWanted: defaultGasWanted
        }
      )) as BroadcastTxCommitResult;

    // Parse the response from the node
    const drawResponseRaw: string | null =
      drawResponse.deliver_tx.ResponseBase.Data;
    if (!drawResponseRaw) {
      throw new Error('invalid draw response');
    }

    const game: Game = JSON.parse(drawResponseRaw);

    // Check if the game is drawn
    switch (game.state) {
      case GameState.DRAWN_5_FOLD:
      case GameState.DRAWN_75_MOVE:
      case GameState.DRAWN_50_MOVE:
      case GameState.DRAWN_3_FOLD:
      case GameState.DRAWN_BY_AGREEMENT:
        return game;
      default:
    }

    return this.waitForDraw(
      gameID,
      timeout ? timeout : drawRequestTimer * 1000
    );
  }

  /**
   * Waits for the game with the current ID to end in a draw
   * @param gameID the ID of the current game
   * @param timeout the timeout value (in ms)
   * @private
   */
  private async waitForDraw(gameID: string, timeout: number): Promise<Game> {
    return new Promise(async (resolve, reject) => {
      const exitTimeout = timeout;

      const fetchInterval = setInterval(async () => {
        try {
          // Get the game
          const getGameResponse: string =
            (await this.provider?.evaluateExpression(
              chessRealm,
              `GetGame(${gameID})`
            )) as string;

          // Parse the response
          const game: Game = JSON.parse(getGameResponse);

          if (game.state === GameState.DRAWN_INSUFFICIENT) {
            // Clear the fetch interval
            clearInterval(fetchInterval);

            reject('draw rejected');
          }

          switch (game.state) {
            case GameState.DRAWN_5_FOLD:
            case GameState.DRAWN_75_MOVE:
            case GameState.DRAWN_50_MOVE:
            case GameState.DRAWN_3_FOLD:
            case GameState.DRAWN_BY_AGREEMENT:
              // Clear the fetch interval
              clearInterval(fetchInterval);

              resolve(game);

              return;
            default:
          }
        } catch (e) {
          // Game not drawn yet...
        }
      }, 1000);

      setTimeout(() => {
        // Clear the fetch interval
        clearInterval(fetchInterval);

        reject('wait timeout exceeded');
      }, exitTimeout);
    });
  }

  /**
   * Triggers the game resignation
   * @param gameID the ID of the running game
   */
  async requestResign(gameID: string): Promise<Game> {
    // Make the request
    const resignResponse: BroadcastTxCommitResult =
      (await this.wallet?.callMethod(
        chessRealm,
        'Resign',
        [gameID],
        TransactionEndpoint.BROADCAST_TX_COMMIT,
        undefined,
        {
          gasFee: defaultTxFee,
          gasWanted: defaultGasWanted
        }
      )) as BroadcastTxCommitResult;

    // Parse the response from the node
    const resignResponseRaw: string | null =
      resignResponse.deliver_tx.ResponseBase.Data;
    if (!resignResponseRaw) {
      throw new Error('invalid resign response');
    }

    // Magically parse the response
    return JSON.parse(resignResponseRaw);
  }

  /**
   * Declines the draw for the game
   * @param gameID the ID of the running game
   */
  async declineDraw(gameID: string): Promise<Game> {
    // Make the request
    const declineResponse: BroadcastTxCommitResult =
      (await this.wallet?.callMethod(
        chessRealm,
        'DrawRefuse',
        [gameID],
        TransactionEndpoint.BROADCAST_TX_COMMIT,
        undefined,
        {
          gasFee: defaultTxFee,
          gasWanted: defaultGasWanted
        }
      )) as BroadcastTxCommitResult;

    // Parse the response from the node
    const declineResponseRaw: string | null =
      declineResponse.deliver_tx.ResponseBase.Data;
    if (!declineResponseRaw) {
      throw new Error('invalid draw refuse response');
    }

    // Magically parse the response
    return JSON.parse(declineResponseRaw);
  }

  /**
   * Accepts the draw for the game
   * @param gameID the ID of the running game
   */
  async acceptDraw(gameID: string): Promise<Game> {
    // Make the request
    const acceptResponse: BroadcastTxCommitResult =
      (await this.wallet?.callMethod(
        chessRealm,
        'Draw',
        [gameID],
        TransactionEndpoint.BROADCAST_TX_COMMIT,
        undefined,
        {
          gasFee: defaultTxFee,
          gasWanted: defaultGasWanted
        }
      )) as BroadcastTxCommitResult;

    // Parse the response from the node
    const acceptResponseRaw: string | null =
      acceptResponse.deliver_tx.ResponseBase.Data;
    if (!acceptResponseRaw) {
      throw new Error('invalid draw accept response');
    }

    // Magically parse the response
    return JSON.parse(acceptResponseRaw);
  }

  /****************
   * DASHBOARD
   ****************/

  /**
   * Fetches the current user player profile
   */
  async getUserData(): Promise<Player> {
    // Get the current player address
    const address: string = (await this.wallet?.getAddress()) as string;

    // Return the player data
    return this.getPlayer(address);
  }

  /**
   * Fetches a list of all players,
   * ordered by their position in the leaderboard
   */
  async getLeaderboard(): Promise<Player[]> {
    const leaderboardResponse: string =
      (await this.provider?.evaluateExpression(
        chessRealm,
        'Leaderboard()'
      )) as string;

    // Parse the response
    return JSON.parse(leaderboardResponse);
  }

  /**
   * Fetches the player score data
   * @param playerID the ID of the player (can be address or @username)
   */
  async getPlayer(playerID: string): Promise<Player> {
    const playerResponse: string = (await this.provider?.evaluateExpression(
      chessRealm,
      `GetPlayer(${playerID})`
    )) as string;

    // Parse the response
    return JSON.parse(playerResponse);
  }

  /**
   * Destroys the Actions instance, and closes any running services
   */
  public destroy() {
    if (!this.provider) {
      // Nothing to close
      return;
    }

    // Close out the WS connection
    this.provider.closeConnection();
  }

  /**
   * Pings the faucet to fund the account before playing
   * @private
   */
  private async fundAccount(): Promise<void> {
    // Prepare the request options
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'faucet-token': this.faucetToken as string
      },
      body: JSON.stringify({
        to: await this.wallet?.getAddress()
      })
    };

    // TODO @Alexis do we want this to propagate the error?
    // The error can be that the user is funded already
    try {
      // Execute the request
      await fetch(faucetURL, requestOptions);
    } catch (e) {
      console.error(`Unable to fund account: ${e}`);
    }
  }
}

export default Actions;
