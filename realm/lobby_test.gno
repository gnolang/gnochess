package chess

import (
	"fmt"
	"std"
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
