// this file concerns mostly with "discovery"; ie. finding information
// about a user's chess playing and previous games

package chess

import (
	"bytes"
	"sort"
	"std"
	"strconv"
	"strings"

	"gno.land/p/demo/avl"
	"gno.land/r/demo/users"
)

// realm state
var (
	playerStore avl.Tree // std.Address -> Player
	leaderboard leaderboardType
)

func GetPlayer(player string) string {
	addr := parsePlayer(player)
	v, ok := playerStore.Get(addr.String())
	if !ok {
		panic("player not found: " + player)
	}
	b, err := v.(Player).MarshalJSON()
	if err != nil {
		panic(err)
	}
	return string(b)
}

// Player contains game-related player information.
type Player struct {
	Address             std.Address
	Wins, Losses, Draws int
	Rating              *PlayerRating
}

// Score for determining leaderboards.
func (p Player) Score() float64 {
	return p.Rating.Rating
}

// Leaderboard position, 0 indexed.
// Dynamically calculated to avoid having to shift positions when LB changes.
func (p Player) LeaderboardPosition() int {
	pos, ok := leaderboard.find(p.Score(), p.Address)
	if !ok {
		return -1
	}
	return pos
}

func (p Player) MarshalJSON() ([]byte, error) {
	u := users.GetUserByAddress(p.Address)

	var buf bytes.Buffer
	buf.WriteByte('{')

	buf.WriteString(`"address":"` + p.Address.String() + `",`)
	if u == nil {
		buf.WriteString(`"username":"",`)
	} else {
		buf.WriteString(`"username":"` + u.Name() + `",`)
	}
	buf.WriteString(`"wins":` + strconv.Itoa(p.Wins) + ",")
	buf.WriteString(`"losses":` + strconv.Itoa(p.Losses) + ",")
	buf.WriteString(`"draws":` + strconv.Itoa(p.Draws) + ",")
	buf.WriteString(`"rating":`)
	if res, err := p.Rating.MarshalJSON(); err != nil {
		return nil, err
	} else {
		buf.Write(res)
	}
	buf.WriteByte(',')
	buf.WriteString(`"position":` + strconv.Itoa(p.LeaderboardPosition()))

	buf.WriteByte('}')
	return buf.Bytes(), nil
}

func saveGameResult(g *Game) {
	w, b := getPlayer(g.White), getPlayer(g.Black)

	// Get numeric result for glicko2.
	var result float64
	switch g.Winner {
	case WinnerWhite:
		w.Wins++
		b.Losses++
		result = 1
	case WinnerBlack:
		w.Losses++
		b.Wins++
		result = 0
	case WinnerDraw:
		w.Draws++
		b.Draws++
		result = 0.5
	default:
		return // TODO: maybe panic
	}

	// Create ratings if the players don't hve them
	if w.Rating == nil {
		w.Rating = NewPlayerRating(g.White)
		playerRatings = append(playerRatings, w.Rating)
	}
	if b.Rating == nil {
		b.Rating = NewPlayerRating(g.Black)
		playerRatings = append(playerRatings, b.Rating)
	}

	// Call glicko 2 rating calculator.
	owr, obr := w.Rating.Rating, b.Rating.Rating
	updateRatings(playerRatings, []RatingScore{{
		White: g.White,
		Black: g.Black,
		Score: result,
	}})

	// Save in playerStore.
	playerStore.Set(w.Address.String(), w)
	playerStore.Set(b.Address.String(), b)
	if g.Winner != WinnerDraw {
		leaderboard, _ = leaderboard.push(g.White, owr, w.Rating.Rating)
		leaderboard, _ = leaderboard.push(g.Black, obr, b.Rating.Rating)
	}
}

func getPlayer(addr std.Address) Player {
	praw, ok := playerStore.Get(addr.String())
	var p Player
	if ok {
		p = praw.(Player)
	} else {
		p = Player{Address: addr}
	}
	return p
}

type lbEntry struct {
	addr  std.Address
	score float64
}

type leaderboardType []lbEntry

// find performs binary search on leaderboard to find the first
// position where score appears, or anything lesser than it.
// Additionally, if addr is given, it finds the position where the given address appears.
// The second return parameter returns whether the address was found.
//
// The index will be 0 if the score is higher than any other on the leaderboard,
// and len(leaderboards) if it is lower than any other.
func (lb leaderboardType) find(score float64, addr std.Address) (int, bool) {
	i := sort.Search(len(lb), func(i int) bool {
		return lb[i].score <= score
	})
	if addr == "" || i == len(lb) {
		return i, false
	}
	for j := 0; lb[i+j].score == score; j++ {
		if lb[i+j].addr == addr {
			return i + j, true
		}
	}
	return i, false
}

// push adds or modifies the player's position in the leaderboard.
// the new leaderboard, and the new position of the player in the leaderboard is returned (0-indexed)
func (lb leaderboardType) push(player std.Address, oldScore, newScore float64) (leaderboardType, int) {
	// determine where the player is, currently
	oldPos, found := lb.find(oldScore, player)
	if found && (oldScore == newScore) {
		return lb, oldPos
	}

	// determine where to place the player next.
	newPos, _ := lb.find(newScore, "")

	var n leaderboardType
	switch {
	case !found:
		n = append(leaderboardType{}, lb[:newPos]...)
		n = append(n, lbEntry{player, newScore})
		n = append(n, lb[newPos:]...)

	case oldPos == newPos:
		n = lb
		n[newPos] = lbEntry{player, newScore}
	case oldPos > newPos:
		n = append(leaderboardType{}, lb[:newPos]...)
		n = append(n, lbEntry{player, newScore})
		n = append(n, lb[newPos:oldPos]...)
		n = append(n, lb[oldPos+1:]...)
	default: // oldPos < newPos
		n = append(leaderboardType{}, lb[:oldPos]...)
		n = append(n, lb[oldPos+1:newPos]...)
		n = append(n, lbEntry{player, newScore})
		n = append(n, lb[newPos:]...)
	}
	return n, newPos
}

// Leaderboard returns a list of all users, ordered by their position in the leaderboard.
func Leaderboard() string {
	var buf bytes.Buffer
	buf.WriteByte('[')
	for idx, entry := range leaderboard {
		p, _ := playerStore.Get(entry.addr.String())
		d, err := p.(Player).MarshalJSON()
		if err != nil {
			panic(err)
		}
		buf.Write(d)
		if idx != len(leaderboard)-1 {
			buf.WriteByte(',')
		}
	}
	buf.WriteByte(']')
	return buf.String()
}

// ListGames provides game listing functionality, with filter-based search functionality.
//
// available filters:
//
//	player:<player> white:<player> black:<player> finished:bool
//	limit:int id<cmp>int sort:asc/desc
//	<cmp>: '<' or '>'
//	<player>: either a bech32 address, "@user" (r/demo/users), or "caller"
func ListGames(filters string) string {
	ft := parseFilters(filters)
	results := make([]*Game, 0, ft.limit)
	cb := func(g *Game) (stop bool) {
		if !ft.valid(g) {
			return false
		}
		results = append(results, g)
		return len(results) >= ft.limit
	}

	// iterate over user2games array if we have one;
	// if we don't, iterate over games.
	if ft.u2gAddr != "" {
		v, ok := user2Games.Get(ft.u2gAddr.String())
		if !ok {
			return "[]"
		}
		games := v.([]*Game)
		if ft.reverse {
			for i := len(games) - 1; i >= 0; i-- {
				if cb(games[i]) {
					break
				}
			}
		} else {
			for _, game := range games {
				if cb(game) {
					break
				}
			}
		}
	} else {
		fn := gameStore.Iterate
		if ft.reverse {
			fn = gameStore.ReverseIterate
		}
		fn(ft.minID, ft.maxID, func(_ string, v interface{}) bool {
			return cb(v.(*Game))
		})
	}

	// fast path: no results
	if len(results) == 0 {
		return "[]"
	}

	// encode json
	var buf bytes.Buffer
	buf.WriteByte('[')
	for idx, g := range results {
		buf.WriteString(g.json())
		if idx != len(results)-1 {
			buf.WriteByte(',')
		}
	}
	buf.WriteByte(']')

	return buf.String()
}

type listGamesFilters struct {
	filters []func(*Game) bool
	u2gAddr std.Address
	maxID   string
	minID   string
	limit   int
	reverse bool
}

func (l *listGamesFilters) valid(game *Game) bool {
	for _, filt := range l.filters {
		if !filt(game) {
			return false
		}
	}
	return true
}

func parseFilters(filters string) (r listGamesFilters) {
	// default to desc order
	r.reverse = true

	parts := strings.Fields(filters)
	for _, part := range parts {
		idx := strings.IndexAny(part, ":<>")
		if idx < 0 {
			panic("invalid filter: " + part)
		}
		filt, pred := part[:idx+1], part[idx+1:]
		switch filt {
		case "player:":
			a := parsePlayer(pred)
			r.filters = append(r.filters, func(g *Game) bool { return g.White == a || g.Black == a })
			if r.u2gAddr == "" {
				r.u2gAddr = a
			}
		case "white:":
			a := parsePlayer(pred)
			r.filters = append(r.filters, func(g *Game) bool { return g.White == a })
			if r.u2gAddr == "" {
				r.u2gAddr = a
			}
		case "black:":
			a := parsePlayer(pred)
			r.filters = append(r.filters, func(g *Game) bool { return g.Black == a })
			if r.u2gAddr == "" {
				r.u2gAddr = a
			}
		case "finished:":
			b := parseBool(pred)
			r.filters = append(r.filters, func(g *Game) bool { return g.State.IsFinished() == b })
		case "id<":
			r.maxID = pred
		case "id>":
			r.minID = pred
		case "limit:":
			n, err := strconv.Atoi(pred)
			if err != nil {
				panic(err)
			}
			r.limit = n
		case "sort:":
			r.reverse = pred == "desc"
		default:
			panic("invalid filter: " + filt)
		}
	}
	return
}

func parseBool(s string) bool {
	switch s {
	case "true", "True", "TRUE", "1":
		return true
	case "false", "False", "FALSE", "0":
		return false
	}
	panic("invalid bool " + s)
}

func parsePlayer(s string) std.Address {
	switch {
	case s == "":
		panic("invalid address/user")
	case s == "caller":
		return std.PrevRealm().Addr()
	case s[0] == '@':
		u := users.GetUserByName(s[1:])
		if u == nil {
			panic("user not found: " + s[1:])
		}
		return u.Address()
	case s[0] == 'g':
		return std.Address(s)
	default:
		panic("invalid address/user: " + s)
	}
}
