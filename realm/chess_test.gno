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

var scholarMoves = [...][2]string{
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

func allContained(t *testing.T, val string, strs ...string) {
	t.Helper()
	for _, s := range strs {
		if !strings.Contains(val, s) {
			t.Errorf("result does not contain %q", s)
		}
	}
}

func TestScholarsMate(t *testing.T) {
	cleanup()

	std.TestSetOrigCaller(white)
	g := NewGame(black)

	// known because we always reset the counter in tests
	const id = "000000001"
	for idx, move := range scholarMoves {
		if idx&1 == 0 {
			std.TestSetOrigCaller(white)
		} else {
			std.TestSetOrigCaller(black)
		}
		res := MakeMove(id, move[0], move[1], 0)
		t.Log("move", idx, res)
	}

	g = GetGame(id)
	allContained(t, g,
		"black_checkmated",
		`"concluder":"g1white"`,
		`r1bqkbnr/ppp2Qpp/2np4/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4`,
	)

	allContained(t, GetPlayer(string(white)),
		`"address":"g1white"`,
		`"position":0`,
		`"wins":1`,
		`"losses":0`,
		`"draws":0`,
		`"score":1`,
	)

	allContained(t, GetPlayer(string(black)),
		`"address":"g1black"`,
		`"position":1`,
		`"wins":0`,
		`"losses":1`,
		`"draws":0`,
		`"score":-1`,
	)
}

func TestDrawByAgreement(t *testing.T) {
	cleanup()

	std.TestSetOrigCaller(white)
	g := NewGame(black)

	const id = "000000001"
	for idx, move := range scholarMoves[:4] {
		if idx&1 == 0 {
			std.TestSetOrigCaller(white)
		} else {
			std.TestSetOrigCaller(black)
		}
		res := MakeMove(id, move[0], move[1], 0)
	}

	allContained(t, GetGame(id),
		`"open"`,
		`"concluder":nil`,
		`"draw_offerer":nil`,
	)

	std.TestSetOrigCaller(white)
	allContained(t, DrawOffer(id),
		`"open"`,
		`"concluder":nil`,
		`"draw_offerer":"g1white"`,
	)

	std.TestSetOrigCaller(black)
	allContained(t, Draw(id),
		`"drawn_by_agreement"`,
		`"concluder":"g1black"`,
		`"draw_offerer":"g1white"`,
	)
}
