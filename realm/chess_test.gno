package chess

import (
	"std"
	"strings"
	"testing"

	"gno.land/p/demo/avl"
)

func cleanup() {
	gameStore = avl.Tree{}
	gameIDCounter = 0
	user2Games = avl.Tree{}
	playerStore = avl.Tree{}
	leaderboard = leaderboardType{}
}

func TestNewGame(t *testing.T) {
	cleanup()

	g := NewGame(std.DerivePkgAddr("xx").String())
	println(g)
}

func TestScholarsMate(t *testing.T) {
	cleanup()

	moves := [...][2]string{
		{"e2", "e4"}, // 0 w
		{"e7", "e5"}, // 1 b
		{"f1", "c4"}, // 2 w
		{"b8", "c6"}, // 3 b
		{"d1", "f3"}, // 4 w
		{"d7", "d6"}, // 5 b
		{"f3", "f7"}, // 6 w
	}

	const (
		white std.Address = "g1white"
		black std.Address = "g1black"
	)

	std.TestSetOrigCaller(white)
	g := NewGame(black)

	// known because we always reset the counter in tests
	id := "000000001"
	for idx, move := range moves {
		if idx&1 == 0 {
			std.TestSetOrigCaller(white)
		} else {
			std.TestSetOrigCaller(black)
		}
		res := MakeMove(id, move[0], move[1], 0)
		t.Log("move", idx, res)
	}

	g = GetGame(id)
	for _, s := range [...]string{
		"black_checkmated",
		`"concluder":"g1white"`,
		`r1bqkbnr/ppp2Qpp/2np4/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4`,
	} {
		if !strings.Contains(g, s) {
			t.Errorf("result does not contain %q", s)
		}
	}

	pw := GetPlayer(string(white))
	for _, s := range [...]string{
		`"address":"g1white"`,
		`"position":0`,
		`"wins":1`,
		`"losses":0`,
		`"draws":0`,
		`"score":1`,
	} {
		if !strings.Contains(pw, s) {
			t.Errorf("GetPlayer(white) does not contain %q\n%v", s, pw)
		}
	}

	pb := GetPlayer(string(black))
	for _, s := range [...]string{
		`"address":"g1black"`,
		`"position":1`,
		`"wins":0`,
		`"losses":1`,
		`"draws":0`,
		`"score":-1`,
	} {
		if !strings.Contains(pb, s) {
			t.Errorf("GetPlayer(black) does not contain %q\n%v", s, pw)
		}
	}
}
