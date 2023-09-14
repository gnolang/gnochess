// Realm chess implements a Gno chess server.
package chess

import (
	"bytes"
	"errors"
	"sort"
	"std"
	"strconv"
	"time"

	"gno.land/p/demo/avl"
	"gno.land/p/demo/ufmt"
	"gno.land/r/demo/users"
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

	Creator     std.Address  `json:"creator"`
	CreatedAt   time.Time    `json:"created_at"`
	Concluder   *std.Address `json:"concluder"`
	DrawOfferer *std.Address `json:"draw_offerer"`
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

	nilAddr := func(na *std.Address) string {
		if na == nil {
			return `nil`
		}
		return `"` + na.String() + `"`
	}

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
	b.WriteByte(',')

	b.WriteString(`"creator":"` + g.Creator.String() + `",`)
	b.WriteString(`"created_at":"` + g.CreatedAt.Format(time.RFC3339) + `",`)
	b.WriteString(`"concluder":` + nilAddr(g.Concluder) + ",")
	b.WriteString(`"draw_offerer":` + nilAddr(g.DrawOfferer))

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
	// draw by agreement
	GameStateDrawnByAgreement
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
func NewGame(opponentRaw string) string {
	std.AssertOriginCall()

	opponent := parsePlayer(opponentRaw)
	caller := std.GetOrigCaller()

	val, exist := user2Games.Get(caller.String())
	var games []*Game
	if exist {
		games, _ = val.([]*Game)
	}

	if caller == opponent {
		panic("can't create a game with yourself")
	}

	isBlack := determineColor(games, caller, opponent)

	// Set up Game struct. Save in gameStore and user2games.
	gameIDCounter++
	// id is zero-padded to work well with avl's alphabetic order.
	id := zeroPad9(strconv.FormatUint(gameIDCounter, 10))
	g := Game{
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

	gameStore.Set(g.ID, &g)
	addToUser2Games(caller, &g)
	addToUser2Games(opponent, &g)

	return g.json()
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
		if game.White != opponent && game.Black != opponent {
			continue
		}
		if !game.State.IsFinished() {
			panic(ufmt.Sprintf("game with opponent '%s' (id: %s) is still ongoing", opponent, game.ID))
		}
		if game.White == opponent || game.Black == opponent {
			return game.White == caller
		}
	}
	return false
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

	draw := func() {
		reportPlayerScore(g.White, 0)
		reportPlayerScore(g.Black, 0)
	}
	switch {
	case o == Checkmate && isBlack:
		g.State = GameStateWhiteCheckmated
		reportPlayerScore(g.White, -1)
		reportPlayerScore(g.Black, 1)
	case o == Checkmate && !isBlack:
		g.State = GameStateBlackCheckmated
		reportPlayerScore(g.Black, -1)
		reportPlayerScore(g.White, 1)
	case o == Stalemate:
		g.State = GameStateStalemate
		draw()

	case o == Drawn75Move:
		g.State = GameStateDrawn75Move
		draw()
	case o == Drawn5Fold:
		g.State = GameStateDrawn5Fold
		draw()
	}
	g.Concluder = &caller
	g.DrawOfferer = nil

	return g.json()
}

func Resign(gameID string) string {
	std.AssertOriginCall()

	g := getGame(gameID, true)

	caller := std.GetOrigCaller()
	switch caller {
	case g.Black:
		g.State = GameStateResigned
		reportPlayerScore(g.Black, -1)
		reportPlayerScore(g.White, 1)
	case g.White:
		g.State = GameStateResigned
		reportPlayerScore(g.White, 1)
		reportPlayerScore(g.Black, -1)
	default:
		panic("you are not involved in this game")
	}
	g.Concluder = &caller
	g.DrawOfferer = nil

	return g.json()
}

// DrawOffer creates a draw offer in the current game, if one doesn't already
// exist.
func DrawOffer(gameID string) string {
	std.AssertOriginCall()

	g := getGame(gameID, true)
	caller := std.GetOrigCaller()

	switch {
	case caller != g.Black && caller != g.White:
		panic("you are not involved in this game")
	case g.DrawOfferer != nil:
		panic("a draw offer in this game already exists")
	}

	g.DrawOfferer = &caller
	return g.json()
}

// DrawRefuse refuse a draw offer in the given game.
func DrawRefuse(gameID string) string {
	std.AssertOriginCall()

	g := getGame(gameID, true)
	caller := std.GetOrigCaller()

	switch {
	case caller != g.Black && caller != g.White:
		panic("you are not involved in this game")
	case g.DrawOfferer == nil:
		panic("no draw offer present")
	case *g.DrawOfferer == caller:
		panic("can't refuse an offer you sent yourself")
	}

	g.DrawOfferer = nil
	return g.json()
}

// Draw implements draw by agreement, as well as "single-party" draw:
// - Threefold repetition (§9.2)
// - Fifty-move rule (§9.3)
// - Insufficient material (§9.4)
// Note: stalemate happens as a consequence of a Move, and thus is handled in that function.
func Draw(gameID string) string {
	std.AssertOriginCall()

	g := getGame(gameID, true)

	caller := std.GetOrigCaller()
	if caller != g.Black && caller != g.White {
		panic("you are not involved in this game")
	}

	// accepted draw offer (do early to avoid gas for g.Position.IsFinished())
	if g.DrawOfferer != nil && *g.DrawOfferer != caller {
		g.Concluder = &caller
		g.State = GameStateDrawnByAgreement

		reportPlayerScore(g.Black, 0)
		reportPlayerScore(g.White, 0)

		return g.json()
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
	g.Concluder = &caller
	g.DrawOfferer = nil
	reportPlayerScore(g.Black, 0)
	reportPlayerScore(g.White, 0)

	return g.json()
}
