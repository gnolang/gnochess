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
	playerStore avl.Tree // std.Address -> *Player
	leaderboard leaderboardType
)

func GetPlayer(player string) string {
	addr := parsePlayer(player)
	v, ok := playerStore.Get(addr.String())
	if !ok {
		panic("player not found")
	}
	b, err := v.(*Player).MarshalJSON()
	if err != nil {
		panic(err.Error())
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
	buf.WriteString(`"position":` + strconv.Itoa(p.LeaderboardPosition()))

	buf.WriteByte('}')
	return buf.Bytes(), nil
}

func (g *Game) saveResult() {
	w, b := getPlayer(g.White), getPlayer(g.Black)

	// old score
	ows, obs := w.Score(), b.Score()

	switch g.Winner {
	case WinnerWhite:
		w.Wins++
		b.Losses++
	case WinnerBlack:
		w.Losses++
		b.Wins++
	case WinnerDraw:
		w.Draws++
		b.Draws++
	default:
		return
	}

	// Save in playerStore.
	playerStore.Set(w.Address.String(), w)
	playerStore.Set(b.Address.String(), b)
	if g.Winner != WinnerDraw {
		leaderboard, _ = leaderboard.push(g.White, ows, w.Score())
		leaderboard, _ = leaderboard.push(g.Black, obs, b.Score())
	}
}

func getPlayer(addr std.Address) *Player {
	praw, ok := playerStore.Get(addr.String())
	if ok {
		return praw.(*Player)
	}
	p := new(Player)
	p.Address = addr
	playerStore.Set(addr.String(), p)
	// XXX: This assignment is not needed, but it seems to mark to the realm store
	// that we we "need" this value and it should not be deleted,
	// removing the "unexpected object with id" panic.
	_xxPlayer = p
	return p
}

var _xxPlayer *Player

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
		d, err := p.(*Player).MarshalJSON()
		if err != nil {
			panic(err.Error())
		}
		buf.Write(d)
		if idx != len(leaderboard)-1 {
			buf.WriteByte(',')
		}
	}
	buf.WriteByte(']')
	return buf.String()
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
