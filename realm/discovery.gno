package chess

// this file concerns mostly with "discovery"; ie. finding information
// about a user's chess playing and previous games

// player=address white=address black=address ongoing=bool
func ListGames(filters string) {}

func GetGame(id string) Game {
	g, ok := gameStore.Get(id)
	if !ok {
		panic("game not found: " + id)
	}
	return g.(*Game)
}
