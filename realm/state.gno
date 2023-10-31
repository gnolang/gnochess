package chess

import (
	"gno.land/p/demo/avl"
)

type RealmState struct {
	// chess.gno
	gameStore     avl.Tree // string (game ID) -> *Game
	gameIDCounter uint64
	user2Games    avl.Tree // std.Address -> []*Game

	// discovery.gno
	playerStore avl.Tree // std.Address -> *Player
	leaderboard [CategoryMax]leaderboardType

	// glicko2.gno
	playerRatings [CategoryMax][]*PlayerRating
}

func RetrieveRealmState() *RealmState {
	return &RealmState{
		gameStore:     gameStore,
		gameIDCounter: gameIDCounter,
		user2Games:    user2Games,
		playerStore:   playerStore,
		leaderboard:   leaderboard,
		playerRatings: playerRatings,
	}
}
