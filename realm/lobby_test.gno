package chess

import (
	"fmt"
	"std"
	"strings"
	"testing"
	"time"

	"internal/os_test"
)

func TestLobby(t *testing.T) {
	cleanup()
	std.TestSetOrigCaller(white)
	LobbyJoin(10*60, 5)
	os_test.Sleep(time.Second * 5)
	std.TestSetOrigCaller(black)
	LobbyJoin(10*60, 5)
	res := LobbyGameFound()
	if res == "null" {
		t.Errorf("LobbyGameFound is null")
	}
	t.Log(res)
}

func TestLobbyJoin_HasOpenGames(t *testing.T) {
	cleanup()
	std.TestSetOrigCaller(white)
	g := &Game{
		ID:    "123",
		White: white,
		Black: black,
		State: GameStateOpen,
	}
	gameStore.Set(g.ID, g)
	addToUser2Games(white, g)
	addToUser2Games(black, g)

	defer func() {
		e := recover()
		if !strings.Contains(fmt.Sprint(e), "game 123 is not yet finished") {
			t.Errorf("expecting 'game is not finished' panic, got %v", e)
		}
	}()

	LobbyJoin(10*60, 5)
}
