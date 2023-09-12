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
}

// Score for determining leaderboards.
func (p Player) Score() int {
	return p.Wins - p.Losses
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
	buf.WriteString(`"score":` + strconv.Itoa(p.Score()) + ",")
	buf.WriteString(`"position":` + strconv.Itoa(p.LeaderboardPosition()))

	buf.WriteByte('}')
	return buf.Bytes(), nil
}

// result: 1 win, 0 draw, -1 loss
func reportPlayerScore(addr std.Address, result int) {
	praw, ok := playerStore.Get(addr.String())
	var p Player
	if ok {
		p = praw.(Player)
	} else {
		p = Player{Address: addr}
	}
	oscore := p.Score() // o' score 🤌
	switch result {
	case 1:
		p.Wins++
	case 0:
		p.Draws++
	case -1:
		p.Losses++
	}
	playerStore.Set(addr.String(), p)
	if result != 0 {
		leaderboard, _ = leaderboard.push(addr, oscore, oscore+result)
	}
}

type lbEntry struct {
	addr  std.Address
	score int
}

type leaderboardType []lbEntry

// find performs binary search on leaderboard to find the first
// position where score appears, or anything lesser than it.
// Additionally, if addr is given, it finds the position where the given address appears.
// The second return parameter returns whether the address was found.
//
// The index will be 0 if the score is higher than any other on the leaderboard,
// and len(leaderboards) if it is lower than any other.
func (lb leaderboardType) find(score int, addr std.Address) (int, bool) {
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
func (lb leaderboardType) push(player std.Address, oldScore, newScore int) (leaderboardType, int) {
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
