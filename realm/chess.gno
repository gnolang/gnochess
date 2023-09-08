// Realm chess implements a Gno chess server.
package chess

import (
	"bytes"
	"errors"
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
	ID        string      `json:"id"`
	White     std.Address `json:"white"`
	Black     std.Address `json:"black"`
	Position  Position    `json:"position"`
	State     GameState   `json:"state"`
	CreatedAt time.Time   `json:"created_at"`
}

func (g Game) json() string {
	s, err := g.MarshalJSON()
	if err != nil {
		panic(err)
	}
	return string(s)
}

func (g Game) MarshalJSON() ([]byte, error) {
	var b bytes.Buffer
	b.WriteByte('{')

	b.WriteString(`"id":"` + g.ID + `",`)
	b.WriteString(`"white":"` + g.White.String() + `",`)
	b.WriteString(`"black":"` + g.Black.String() + `",`)

	b.WriteString(`"position":`)
	pdata, err := g.Position.MarshalJSON()
	if err != nil {
		return nil, err
	}
	b.Write(pdata)
	b.WriteString(`,`)

	b.WriteString(`"state":`)
	sdata, err := g.State.MarshalJSON()
	if err != nil {
		return nil, err
	}
	b.Write(sdata)
	b.WriteString(`,`)

	b.WriteString(`"created_at":"` + g.CreatedAt.Format(time.RFC3339) + `"`)

	b.WriteByte('}')
	return b.Bytes(), nil
}

func (p Position) MarshalJSON() ([]byte, error) {
	var b bytes.Buffer
	b.WriteByte('{')

	bfen := p.EncodeFEN()
	b.WriteString(`"fen":"` + bfen + `",`)

	b.WriteString(`"moves":[`)

	for idx, m := range p.Moves {
		b.WriteString(`"` + m.String() + `"`)
		if idx != len(p.Moves)-1 {
			b.WriteByte(',')
		}
	}

	b.WriteByte(']')
	b.WriteByte('}')
	return b.Bytes(), nil
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
	GameStateDrawn75Move
	GameStateDrawn5Fold

	// single-party draws
	GameStateDrawn50Move
	GameStateDrawn3Fold
	GameStateDrawnInsufficient

	// resignation by either player
	GameStateResigned
)

var gameStatesSnake = [...]string{
	GameStateInvalid:           "invalid",
	GameStateOpen:              "open",
	GameStateWhiteCheckmated:   "white_checkmated",
	GameStateBlackCheckmated:   "black_checkmated",
	GameStateStalemate:         "stalemate",
	GameStateDrawn75Move:       "drawn_75_move",
	GameStateDrawn5Fold:        "drawn_5_fold",
	GameStateDrawn50Move:       "drawn_50_move",
	GameStateDrawn3Fold:        "drawn_3_fold",
	GameStateDrawnInsufficient: "drawn_insufficient",
	GameStateResigned:          "resigned",
}

func (g GameState) MarshalJSON() ([]byte, error) {
	if int(g) >= len(gameStatesSnake) {
		return nil, errors.New("invalid game state")
	}
	return []byte(`"` + gameStatesSnake[g] + `"`), nil
}

// IsFinished returns whether the game is in a finished state.
func (g GameState) IsFinished() bool {
	return g != GameStateOpen
}

// NewGame initialized a new game with the given opponent.
func NewGame(opponent std.Address) string {
	std.AssertOriginCall()

	return newGame(opponent)
}

// NewGameWithUsername starts a new game with a user identified by their
// username, regularly registered at r/demo/users.
func NewGameWithUsername(username string) string {
	std.AssertOriginCall()

	u := users.GetUserByName(username)
	if u == nil {
		panic("user not found: " + username)
	}
	return newGame(u.Address())
}

func newGame(opponent std.Address) string {
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
		Position:  NewPosition(),
		State:     GameStateOpen,
		CreatedAt: time.Now(),
	}
	if isBlack {
		g.White, g.Black = g.Black, g.White
	}

	gameStore.Set(g.ID, &g)

	return g.json()
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
func MakeMove(gameID, from, to string, promote Piece) string {
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

	o := newp.IsFinished()
	if o == NotFinished {
		return g.json()
	}

	switch {
	case o == Checkmate && isBlack:
		g.State = GameStateWhiteCheckmated
	case o == Checkmate && !isBlack:
		g.State = GameStateBlackCheckmated
	case o == Stalemate:
		g.State = GameStateStalemate

	case o == Drawn75Move:
		g.State = GameStateDrawn75Move
	case o == Drawn5Fold:
		g.State = GameStateDrawn5Fold
	}
	return g.json()
}

func Resign(gameID string) string {
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
	switch caller {
	case g.Black:
		g.State = GameStateResigned
	case g.White:
		g.State = GameStateResigned
	default:
		panic("you are not involved in this game")
	}

	return g.json()
}

// Draw implements "single-party" draw (ie. not draw by agreement)
// - Threefold repetition (§9.2)
// - Fifty-move rule (§9.3)
// - Insufficient material (§9.4)
// Note: stalemate happens as a consequence of a Move, and thus is handled in that function.
func Draw(gameID string) string {
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
	if caller != g.Black && caller != g.White {
		panic("you are not involved in this game")
	}

	o := g.Position.IsFinished()
	switch {
	case o&Can50Move != 0:
		g.State = GameStateDrawn50Move
	case o&Can3Fold != 0:
		g.State = GameStateDrawn3Fold
	case o&CanInsufficient != 0:
		g.State = GameStateDrawnInsufficient
	default:
		panic("this game can't be automatically drawn")
	}

	return g.json()
}
