package chess

import (
	"std"

	"gno.land/p/demo/avl"
)

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

var allPlayerStats avl.Tree // std.Address -> *playerStats

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

func AllPlayerStats() []playerStats {
	ret := []playerStats{}

	allPlayerStats.Iterate("", "", func(addrString string, v interface{}) bool {
		// stats := *(v.(*playerStats))
		// stats.Addr = std.Address(addrString)
		// ret = append(ret, stats)
		return false
	})

	return ret
}
