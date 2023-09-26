package chess

import (
	"std"

	"gno.land/p/demo/avl"
	"gno.land/p/demo/ufmt"
)

var allPlayerStats avl.Tree // std.Address -> *playerStats

type playerStats struct {
	Addr          std.Address // Not stored when in avl.Tree, but lazily filled for public-facing helpers returning playerStats.
	Moves         uint
	StartedGames  uint
	WonGames      uint
	LostGames     uint
	TimedoutGames uint
	ResignedGames uint
	DrawnGames    uint
	SeriousGames  uint // finished, or resigned/drawn after 20 full moves (40 turns), used for the raffle.
	// later we can add achievements:
	// SuperFastAchievement // if a game is finished in less than N seconds.
	// OnlyPawnsAchievement // winning with only pawns, etc.
}

func (s playerStats) String() string {
	return ufmt.Sprintf(
		"addr:%s moves:%d started:%d won:%d lost:%d timedout:%d resigned:%d drawn:%d serious:%d",
		s.Addr, s.Moves, s.StartedGames, s.WonGames, s.LostGames, s.TimedoutGames,
		s.ResignedGames, s.DrawnGames, s.SeriousGames,
	)
}

func getPlayerStats(addr std.Address) *playerStats {
	addrStr := string(addr)
	res, found := allPlayerStats.Get(addrStr)
	if found {
		return res.(*playerStats)
	}

	newStats := playerStats{}
	allPlayerStats.Set(addrStr, &newStats)
	return &newStats
}

func GetPlayerStats(addr std.Address) playerStats {
	stats := getPlayerStats(addr)
	cpy := *stats
	cpy.Addr = addr
	return cpy
}

func AllPlayerStats() []playerStats {
	ret := []playerStats{}

	allPlayerStats.Iterate("", "", func(addrString string, v interface{}) bool {
		stats := *(v.(*playerStats))
		stats.Addr = std.Address(addrString)
		ret = append(ret, stats)
		return false
	})

	return ret
}

type gameStats struct {
	caller, opponent, white, black *playerStats
}

func (g Game) getStats(caller std.Address) gameStats {
	stats := gameStats{
		white: getPlayerStats(g.White),
		black: getPlayerStats(g.Black),
	}

	if caller != "" { // if caller is empty, we just fill "black" and "white".
		if caller == g.White {
			stats.caller = stats.white
			stats.opponent = stats.black
		} else {
			stats.caller = stats.black
			stats.opponent = stats.white
		}
	}

	return stats
}

func (g Game) updateEndgameStats() {
	stats := g.getStats("")

	// serious games
	isSerious := false
	switch {
	case g.State == GameStateCheckmated: // checkmates
		isSerious = true
	case len(g.Position.Moves) >= 40: // long games
		isSerious = true
	}
	if isSerious {
		stats.black.SeriousGames++
		stats.white.SeriousGames++
	}

	// timeouts, aborted, etc
	if g.State == GameStateTimeout || g.State == GameStateAborted {
		stats.black.TimedoutGames++
		stats.white.TimedoutGames++
	}

	// winners, losers, draws
	switch g.Winner {
	case WinnerWhite:
		stats.white.WonGames++
		stats.black.LostGames++
		if g.State == GameStateResigned {
			stats.black.ResignedGames++
		}
	case WinnerBlack:
		stats.black.WonGames++
		stats.white.LostGames++
		if g.State == GameStateResigned {
			stats.white.ResignedGames++
		}
	case WinnerDraw:
		stats.black.DrawnGames++
		stats.white.DrawnGames++
	}
}
