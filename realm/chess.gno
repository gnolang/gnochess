// Realm chess implements a Gno chess server.
package chess

import (
	"std"
	"strconv"
	"time"

	"gno.land/p/demo/avl"
	"gno.land/p/demo/ufmt"
	"gno.land/r/demo/users"
)

// realm state
var (
	// not "games" because that's too useful a variable name
	gameStore     avl.Tree // string (game ID) -> *Game
	gameIDCounter uint64

	// std.Address -> []*Game
	// Value must be organized by sorting first by ongoing/finished games (=
	// ongoing games at the beginning), then each reverse-chronologically.
	// This helps perform some optimizations and save gas.
	user2Games avl.Tree
)

// Game represents a chess game.
type Game struct {
	ID        string
	White     std.Address
	Black     std.Address
	Position  Position
	State     GameState
	CreatedAt time.Time
}

// GameState represents the current game state.
type GameState byte

const (
	GameStateInvalid = iota

	GameStateOpen

	// "automatic" endgames following moves
	GameStateWhiteCheckmated
	GameStateBlackCheckmated
	GameStateStalemate

	// resign by either player
	GameStateWhiteResign
	GameStateBlackResign
)

// IsFinished returns whether the game is in a finished state.
func (g GameState) IsFinished() bool {
	return g != GameStateOpen
}

// NewGame initialized a new game with the given opponent.
func NewGame(opponent std.Address) Game {
	std.AssertOriginCall()

	return newGame(opponent)
}

// NewGameWithUsername starts a new game with a user identified by their
// username, regularly registered at r/demo/users.
func NewGameWithUsername(username string) Game {
	std.AssertOriginCall()

	u := users.GetUserByName(username)
	if u == nil {
		panic("user not found: " + username)
	}
	return newGame(u.Address())
}

func newGame(opponent std.Address) Game {
	caller := std.GetOrigCaller()
	val, exist := user2Games.Get(caller.String())
	var games []*Game
	if exist {
		games, _ = val.([]*Game)
	}

	if caller == opponent {
		panic("can't create a game with yourself")
	}

	var isBlack bool
	if len(games) > 0 {
		if hasOngoingGameWithPlayer(games, opponent) {
			panic(ufmt.Sprintf("game with opponent '%s' (id: %s) is still ongoing", opponent))
		}

		// Determine colour of player. If the player has already played with
		// opponent, invert from last game played among them.
		// Otherwise invert from last game played by the player.
		isBlack = games[0].White == caller
		for _, game := range games {
			if game.White == opponent || game.Black == opponent {
				isBlack = game.White == caller
				break
			}
		}
	}

	// 3. Set up Game struct. Save in gameStore and user2games.
	gameIDCounter++
	g := Game{
		ID:        strconv.FormatUint(gameIDCounter, 10),
		White:     std.GetOrigCaller(),
		Black:     opponent,
		Position:  Position{B: NewBoard()},
		State:     GameStateOpen,
		CreatedAt: time.Now(),
	}
	if isBlack {
		g.White, g.Black = g.Black, g.White
	}

	gameStore.Set(g.ID, &g)

	return g
}

func hasOngoingGameWithPlayer(games []*Game, player std.Address) bool {
	for _, game := range games {
		// stop processing at start of finished games
		if game.State.IsFinished() {
			break
		}
		if game.White == player || game.Black == player {
			return true
		}
	}
	return false
}

// MakeMove specifies a move to be done on the given game, specifying in
// algebraic notation the square where to move the piece.
// If the piece is a pawn which is moving to the last row, a promotion piece
// must be specified.
// Castling is specified by indicating the king's movement.
func MakeMove(gameID, from, to string, promote Piece) Game {
	std.AssertOriginCall()

	graw, ok := gameStore.Get(gameID)
	if !ok {
		panic("game not found: " + gameID)
	}
	g := graw.(*Game)

	// determine if this is a black move
	isBlack := len(g.Position.Moves)%2 == 1

	caller := std.GetOrigCaller()
	if (isBlack && g.Black != caller) ||
		(!isBlack && g.White != caller) {
		// either not a player involved; or not the caller's turn.
		panic("you are not allowed to make a move at this time")
	}

	// validate move
	m := Move{
		From: SquareFromString(from),
		To:   SquareFromString(to),
	}
	if m.From == SquareInvalid || m.To == SquareInvalid {
		panic("invalid from/to square")
	}
	if promote > 0 && promote <= PieceKing {
		m.Promotion = promote
	}
	newp, ok := g.Position.ValidateMove(m)
	if !ok {
		panic("illegal move")
	}

	// add move and record new board
	g.Position = newp

	mate := newp.IsMate()
	if mate == NoMate {
		return *g
	}

	switch {
	case mate == Checkmate && isBlack:
		g.State = GameStateWhiteCheckmated
	case mate == Checkmate && !isBlack:
		g.State = GameStateBlackCheckmated
	case mate == Stalemate:
		g.State = GameStateStalemate
	}
	return *g
}

func Resign(gameID string) Game {
	std.AssertOriginCall()

	graw, ok := gameStore.Get(gameID)
	if !ok {
		panic("game not found: " + gameID)
	}
	g := graw.(*Game)

	if g.State.IsFinished() {
		panic("game is already finished")
	}

	caller := std.GetOrigCaller()
	switch {
	case caller == g.Black:
		g.State = GameStateBlackResign
	case caller == g.White:
		g.State = GameStateWhiteResign
	default:
		panic("you are not involved in this game")
	}

	return *g
}

func Draw(gameID string) Game {
	// "single-party" draw (ie. not draw by agreement)
	// - Threefold repetition (§9.2)
	// - Fifty-move rule (§9.3)
	// - Insufficient material (§9.4)
	// Note: stalemate happens as a consequence of a Move, and thus is handled in that function.
}
