// Realm chess implements a Gno chess server.
package chess

import (
	"bytes"
	"errors"
	"std"
	"strconv"
	"time"

	"gno.land/p/demo/avl"
)

// realm state
var (
	// (not "games" because that's too useful a variable name)
	gameStore     avl.Tree // string (game ID) -> *Game
	gameIDCounter uint64

	// Value must be sorted by game ID, descending
	user2Games avl.Tree // std.Address -> []*Game
)

// Game represents a chess game.
type Game struct {
	ID string `json:"id"`

	White    std.Address `json:"white"`
	Black    std.Address `json:"black"`
	Position Position    `json:"position"`
	State    GameState   `json:"state"`
	Winner   Winner      `json:"winner"`

	Creator     std.Address  `json:"creator"`
	CreatedAt   time.Time    `json:"created_at"`
	DrawOfferer *std.Address `json:"draw_offerer"` // set on draw offers
	Concluder   *std.Address `json:"concluder"`    // set on non-auto draws, and aborts
}

func (g Game) json() string {
	s, err := g.MarshalJSON()
	if err != nil {
		panic(err.Error())
	}
	return string(s)
}

func (g Game) MarshalJSON() (_ []byte, err error) {
	var b bytes.Buffer
	b.WriteByte('{')

	nilAddr := func(na *std.Address) string {
		if na == nil {
			return `null`
		}
		return `"` + na.String() + `"`
	}
	mjson := func(s string, val interface{ MarshalJSON() ([]byte, error) }, comma bool) {
		if err != nil {
			return
		}
		var res []byte
		res, err = val.MarshalJSON()
		if err != nil {
			return
		}
		b.WriteString(`"` + s + `":`)
		b.Write(res)
		if comma {
			b.WriteByte(',')
		}
	}

	b.WriteString(`"id":"` + g.ID + `",`)
	b.WriteString(`"white":"` + g.White.String() + `",`)
	b.WriteString(`"black":"` + g.Black.String() + `",`)

	mjson("position", g.Position, true)
	mjson("state", g.State, true)
	mjson("winner", g.Winner, true)
	if err != nil {
		return
	}

	b.WriteString(`"creator":"` + g.Creator.String() + `",`)
	b.WriteString(`"created_at":"` + g.CreatedAt.Format(time.RFC3339) + `",`)
	b.WriteString(`"draw_offerer":` + nilAddr(g.DrawOfferer) + ",")
	b.WriteString(`"concluder":` + nilAddr(g.Concluder))

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

// Winner represents the "direct" outcome of a game
// (white, black or draw?)
type Winner byte

const (
	WinnerNone Winner = iota
	WinnerWhite
	WinnerBlack
	WinnerDraw
)

var winnerString = [...]string{
	WinnerNone:  "none",
	WinnerWhite: "white",
	WinnerBlack: "black",
	WinnerDraw:  "draw",
}

func (w Winner) MarshalJSON() ([]byte, error) {
	if n := int(w); n < len(winnerString) {
		return []byte(`"` + winnerString[n] + `"`), nil
	}
	return nil, errors.New("invalid winner value")
}

// GameState represents the current game state.
type GameState byte

const (
	GameStateInvalid = iota

	GameStateOpen

	// "automatic" endgames following moves
	GameStateCheckmated
	GameStateStalemate
	GameStateDrawn75Move
	GameStateDrawn5Fold

	// single-party draws
	GameStateDrawn50Move
	GameStateDrawn3Fold
	GameStateDrawnInsufficient

	// timeout by either player
	GameStateTimeout
	// aborted within first two moves
	GameStateAborted
	// resignation by either player
	GameStateResigned
	// draw by agreement
	GameStateDrawnByAgreement
)

var gameStatesSnake = [...]string{
	GameStateInvalid:           "invalid",
	GameStateOpen:              "open",
	GameStateCheckmated:        "checkmated",
	GameStateStalemate:         "stalemate",
	GameStateDrawn75Move:       "drawn_75_move",
	GameStateDrawn5Fold:        "drawn_5_fold",
	GameStateDrawn50Move:       "drawn_50_move",
	GameStateDrawn3Fold:        "drawn_3_fold",
	GameStateDrawnInsufficient: "drawn_insufficient",
	GameStateTimeout:           "timeout",
	GameStateAborted:           "aborted",
	GameStateResigned:          "resigned",
	GameStateDrawnByAgreement:  "drawn_by_agreement",
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
// opponent may be a bech32 address or "@user" (r/demo/users).
//
// seconds and increment specifies the time control for the given game.
// seconds is the amount of time given to play to each player; increment
// is by how many seconds the player's time should be increased when they make a move.
// seconds <= 0 means no time control (correspondence).
func NewGame(opponentRaw string, seconds, increment int) string {
	std.AssertOriginCall()

	if seconds >= 0 && increment < 0 {
		panic("negative increment invalid")
	}

	opponent := parsePlayer(opponentRaw)
	caller := std.GetOrigCaller()

	return newGame(caller, opponent, seconds, increment).json()
}

func getUserGames(user std.Address) []*Game {
	val, exist := user2Games.Get(user.String())
	var games []*Game
	if !exist {
		return nil
	}
	return val.([]*Game)
}

func assertGamesFinished(games []*Game) {
	for _, g := range games {
		if !g.State.IsFinished() {
			panic("can't start new game: game " + g.ID + " is not yet finished")
		}
		continue
	}
}

func newGame(caller, opponent std.Address, seconds, increment int) *Game {
	games := getUserGames(caller)
	// Ensure player has no ongoing games.
	assertGamesFinished(games)
	assertGamesFinished(getUserGames(opponent))

	if caller == opponent {
		panic("can't create a game with yourself")
	}

	isBlack := determineColor(games, caller, opponent)

	// Set up Game struct. Save in gameStore and user2games.
	gameIDCounter++
	// id is zero-padded to work well with avl's alphabetic order.
	id := zeroPad9(strconv.FormatUint(gameIDCounter, 10))
	g := &Game{
		ID:        id,
		White:     caller,
		Black:     opponent,
		Position:  NewPosition(),
		State:     GameStateOpen,
		Creator:   caller,
		CreatedAt: time.Now(),
	}
	if isBlack {
		g.White, g.Black = g.Black, g.White
	}

	gameStore.Set(g.ID, g)
	addToUser2Games(caller, g)
	addToUser2Games(opponent, g)

	return g
}

const zeroes = "000000000"

// zeroPad9 pads s to the left with zeroes until it's at least 9 bytes long.
func zeroPad9(s string) string {
	n := 9 - len(s)
	if n < 0 {
		return s
	}
	return zeroes[:n] + s
}

func addToUser2Games(addr std.Address, game *Game) {
	var games []*Game
	v, ok := user2Games.Get(string(addr))
	if ok {
		games = v.([]*Game)
	}
	// game must be at top, because it is the latest ID
	games = append([]*Game{game}, games...)
	user2Games.Set(string(addr), games)
}

func determineColor(games []*Game, caller, opponent std.Address) (isBlack bool) {
	// fast path for no games
	if len(games) == 0 {
		return false
	}

	// Determine color of player. If the player has already played with
	// opponent, invert from last game played among them.
	// Otherwise invert from last game played by the player.
	isBlack = games[0].White == caller

	// "try" to save gas if the user has really a lot of past games
	if len(games) > 256 {
		games = games[:256]
	}
	for _, game := range games {
		if game.White == opponent || game.Black == opponent {
			return game.White == caller
		}
	}
	return
}

// GetGame returns a game, knowing its ID.
func GetGame(id string) string {
	return getGame(id, false).json()
}

func getGame(id string, wantOpen bool) *Game {
	graw, ok := gameStore.Get(id)
	if !ok {
		panic("game not found")
	}
	g := graw.(*Game)
	if wantOpen && g.State.IsFinished() {
		panic("game is already finished")
	}
	return g
}

// MakeMove specifies a move to be done on the given game, specifying in
// algebraic notation the square where to move the piece.
// If the piece is a pawn which is moving to the last row, a promotion piece
// must be specified.
// Castling is specified by indicating the king's movement.
func MakeMove(gameID, from, to string, promote Piece) string {
	std.AssertOriginCall()

	g := getGame(gameID, true)

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
		// opponent of draw offerer has made a move. take as implicit rejection of draw.
		if g.DrawOfferer != nil && *g.DrawOfferer != caller {
			g.DrawOfferer = nil
		}

		return g.json()
	}

	switch {
	case o == Checkmate && isBlack:
		g.State = GameStateCheckmated
		g.Winner = WinnerBlack
	case o == Checkmate && !isBlack:
		g.State = GameStateCheckmated
		g.Winner = WinnerWhite
	case o == Stalemate:
		g.State = GameStateStalemate
		g.Winner = WinnerDraw

	case o == Drawn75Move:
		g.State = GameStateDrawn75Move
		g.Winner = WinnerDraw
	case o == Drawn5Fold:
		g.State = GameStateDrawn5Fold
		g.Winner = WinnerDraw
	}
	g.DrawOfferer = nil
	g.saveResult()

	return g.json()
}
