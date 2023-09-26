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
