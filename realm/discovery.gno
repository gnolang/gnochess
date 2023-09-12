package chess

import (
	"bytes"
	"std"
	"strconv"
	"strings"

	"gno.land/p/demo/avl"
	"gno.land/r/demo/users"
)

// this file concerns mostly with "discovery"; ie. finding information
// about a user's chess playing and previous games

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

// GetGame returns a game, knowing its ID.
func GetGame(id string) string {
	g, ok := gameStore.Get(id)
	if !ok {
		panic("game not found: " + id)
	}
	var gg *Game
	gg = g.(*Game)
	return gg.json()
}
