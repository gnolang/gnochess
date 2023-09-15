package chess

import (
	"fmt"
	"std"
	"strconv"
	"strings"
	"testing"
	"time"

	"internal/os_test"

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

	g := NewGame(std.DerivePkgAddr("xx").String(), 0, 0)
	println(g)
}

const (
	white std.Address = "g1white"
	black std.Address = "g1black"
)

/*
syntax:

	[<command> ][#[!][<buf>] <checker>]

command is executed; result of command is stored in buffer.
the test is split in lines. other white space is ignored (strings.Fields).

<buf>: all commands below will generally store a string result value in the
buffer "result", which is the default and thus may be omitted.
if the command panics, the panic value is stored in the buffer "panic".
(if it doesn't, buffer panic is set to an empty string).
if following a command there is no checker on the #panic buffer, the line
"#!panic empty" is implicitly added.
if <buf> is preceded by ! (e.g. "#!panic empty"), then if the checker fails,
processing is stopped on that line.

<command>:

	newgame [<seconds> [<increment>]]
		stores game ID in buffer #id.
		always calls as white, creating a new game against black.
	move <black|white|auto> <lan_move>
		lan_move is in the same format as Move.String.
		auto inverts from the last move's color.
		retrieves game id from #id.
	draw <black|white|auto>
	drawoffer <black|white|auto>
	timeout <black|white|auto>
		(ClaimTimeout)
	resign <black|white|auto>
	game [<id>]
		if not given, id is retrieved from buffer #id.
	player <player>
		player values "white" and "black" are auto converted to their
		addresses.

	name <predicate>
		sets the name of the test to predicate.
	copy <dst> [<src>]
		copies buffer src to buffer dst.
		if src not specified, assumed result.
		(don't specify the #; ie: copy oldresult result)
	sleep <seconds>
		sleep for the given amount of seconds (float).

<checker>:

	empty
		the buffer should be empty.
	equal <predicate>
		predicate may start with #, which indicates a buffer.
	contains [<predicate>...]
		the buffer should contain all of the given predicates.
	containssp <predicate>
		the buffer should contain the given predicate, which contains spaces.
*/
var commandTests = [...]string{
	`	name ScholarsMate
		newgame #id equal 000000001
		move auto e2e4
		move auto e7e5
		move auto f1c4
		move auto b8c6
		move auto d1f3
		move auto d7d6
		move auto f3f7
		copy moveres
		game # equal moveres
		# contains "state":"checkmated" "concluder":"g1white"
		# containssp r1bqkbnr/ppp2Qpp/2np4/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4
		player white
		# contains "address":"g1white" "position":0 "wins":1 "losses":0 "draws":0 "score":1
		player black
		# contains "address":"g1black" "position":1 "wins":0 "losses":1 "draws":0 "score":-1
	`,
	`	name DrawByAgreement
		move auto e2e4
		move auto e7e5
		move auto f1c4
		move auto b8c6
		copy moveres
		game # equal moveres
		# contains "open" "concluder":nil "draw_offerer":nil
		drawoffer white
		# contains "open" "concluder":nil "draw_offerer":"g1white"
		draw black
		# contains "drawn_by_agreement" "concluder":"g1black" "draw_offerer":"g1white"
	`,
}

func TestCommands(t *testing.T) {
	for _, command := range commandTests {
		runCommandTest(t, command)
	}
}

func runCommandTest(t *testing.T, command string) {
	lines := strings.Split(command, "\n")
	var funcs []func(t *testing.T, bufs map[string]string)
	var testName string
	atoi := func(s string) int {
		n, err := strconv.Atoi(s)
		if err != nil {
			panic(err)
		}
		return n
	}
	catch := func(bufs map[string]string) {
		e := recover()
		if e == nil {
			bufs["result"] = ""
			bufs["panic"] = ""
			return
		}
		bufs["panic"] = fmt.Sprint(e)
	}
	// so first move, if auto, is white
	lastMove := black
	parseColor := func(s string) std.Address {
		switch s {
		case "black":
			return black
		case "white":
			return white
		case "auto":
			if lastMove == white {
				return black
			}
			return white
		default:
			panic("invalid color " + s)
		}
	}
	fnColorGameID := func(fn func(string) string, s string, command []string, line string) {
		if len(command) != 2 {
			panic("invalid " + s + " command " + line)
		}
		addr := parseColor(command[1])
		funcs = append(funcs, func(t *testing.T, bufs map[string]string) {
			defer catch(bufs)
			std.TestSetOrigCaller(addr)
			bufs["result"] = fn(bufs["id"])
		})
	}
	var hasPanicChecker bool

	for _, line := range lines {
		println("PROCA", line)
		flds := strings.Fields(line)
		if len(flds) == 0 {
			continue
		}
		command, checker := flds, ([]string)(nil)
		for idx, fld := range flds {
			if strings.HasPrefix(fld, "#") {
				command, checker = flds[:idx], flds[idx:]
				break
			}
		}
		var cmd string
		if len(command) > 0 {
			cmd = command[0]

			// there is a new command; if hasPanicChecker == false,
			// it means the previous command did not have a panic checker.
			// add it.
			if !hasPanicChecker && len(funcs) > 0 {
				funcs = append(funcs, func(t *testing.T, bufs map[string]string) {
					if bufs["panic"] != "" {
						t.Fatalf("buffer \"panic\" is not empty (%q)", bufs["panic"])
					}
				})
			}
		}
		switch cmd {
		case "": // move on
		case "newgame":
			var seconds, incr int
			switch len(command) {
			case 1:
			case 2:
				seconds = atoi(command[1])
			case 3:
				seconds, incr = atoi(command[1]), atoi(command[2])
			default:
				panic("invalid newgame command " + line)
			}
			funcs = append(funcs, func(t *testing.T, bufs map[string]string) {
				defer catch(bufs)
				std.TestSetOrigCaller(white)
				res := NewGame(black, seconds, incr)
				bufs["result"] = res
				const idMagicString = `"id":"`
				idx := strings.Index(res, idMagicString)
				if idx < 0 {
					panic("id not found")
				}
				id := res[idx+len(idMagicString):]
				id = id[:strings.IndexByte(id, '"')]
				bufs["id"] = id
			})
		case "move":
			if len(command) != 3 {
				panic("invalid move command " + line)
			}
			addr := parseColor(command[1])
			lastMove = addr
			if len(command[2]) < 4 || len(command[2]) > 5 {
				panic("invalid lan move " + command[2])
			}
			from, to := command[2][:2], command[2][2:4]
			var promotion Piece
			if len(command[2]) == 5 {
				promotion = p[command[2][4]]
				if promotion == PieceEmpty {
					panic("invalid piece for promotion: " + string(command[2][4]))
				}
			}
			funcs = append(funcs, func(t *testing.T, bufs map[string]string) {
				defer catch(bufs)
				std.TestSetOrigCaller(addr)
				bufs["result"] = MakeMove(bufs["id"], from, to, promotion)
			})
		case "draw":
			fnColorGameID(Draw, "draw", command, line)
		case "drawoffer":
			fnColorGameID(DrawOffer, "drawoffer", command, line)
		case "timeout":
			fnColorGameID(ClaimTimeout, "timeout", command, line)
		case "resign":
			fnColorGameID(Resign, "resign", command, line)
		case "game":
			if len(command) > 2 {
				panic("invalid game command " + line)
			}
			var id string
			if len(command) == 2 {
				id = command[1]
			}
			funcs = append(funcs, func(t *testing.T, bufs map[string]string) {
				defer catch(bufs)
				idl := id
				if idl == "" {
					idl = bufs["id"]
				}
				bufs["result"] = GetGame(idl)
			})
		case "player":
			if len(command) != 2 {
				panic("invalid player command " + line)
			}
			v := command[1]
			switch v {
			case "white":
				v = string(white)
			case "black":
				v = string(black)
			}
			funcs = append(funcs, func(t *testing.T, bufs map[string]string) {
				defer catch(bufs)
				bufs["result"] = GetPlayer(v)
			})
		case "name":
			testName = strings.Join(command[1:], " ")
		case "copy":
			if len(command) > 3 || len(command) < 2 {
				panic("invalid copy command " + line)
			}
			src := "result"
			if len(command) == 3 {
				src = command[2]
			}
			dst := command[1]
			funcs = append(funcs, func(t *testing.T, bufs map[string]string) {
				bufs[dst] = bufs[src]
			})
		case "sleep":
			if len(command) != 2 {
				panic("invalid sleep command " + line)
			}
			tim := time.Duration(atoi(command[1])) * time.Second
			funcs = append(funcs, func(t *testing.T, bufs map[string]string) {
				os_test.Sleep(tim)
			})
		default:
			panic("invalid command " + cmd)
		}

		if len(checker) == 0 {
			continue
		}
		if len(checker) == 1 {
			panic("no checker specified " + line)
		}

		bufp := checker[0]
		tf := func(t *testing.T) func(string, ...interface{}) { return t.Errorf }
		if len(bufp) > 1 && bufp[1] == '!' {
			tf = func(t *testing.T) func(string, ...interface{}) { return t.Fatalf }
			bufp = bufp[2:]
		} else {
			bufp = bufp[1:]
		}
		if bufp == "" {
			bufp = "result"
		}
		if bufp == "panic" && !hasPanicChecker {
			hasPanicChecker = true
		}

		switch checker[1] {
		case "empty":
			if len(checker) != 2 {
				panic("invalid empty checker " + line)
			}
			funcs = append(funcs, func(t *testing.T, bufs map[string]string) {
				if bufs[bufp] != "" {
					tf(t)("buffer %q is not empty (%q)", bufp, bufs[bufp])
				}
			})
		case "equal":
			pred := line[len("equal "):]
			isbuf := pred[0] == '#'
			funcs = append(funcs, func(t *testing.T, bufs map[string]string) {
				exp := pred
				if isbuf {
					exp = bufs[pred[1:]]
				}
				if bufs[bufp] != exp {
					tf(t)("buffer %q: want %q got %q", bufp, exp, bufs[bufp])
				}
			})
		case "contains":
			preds := checker[2:]
			if len(preds) == 0 {
				continue
			}
			funcs = append(funcs, func(t *testing.T, bufs map[string]string) {
				for _, pred := range preds {
					if !strings.Contains(bufs[bufp], pred) {
						tf(t)("buffer %q: %q does not contain %q", bufp, bufs[bufp], pred)
					}
				}
			})
		case "containssp":
			pred := strings.Join(checker[2:], " ")
			if pred == "" {
				panic("invalid contanssp checker " + line)
			}
			funcs = append(funcs, func(t *testing.T, bufs map[string]string) {
				if !strings.Contains(bufs[bufp], pred) {
					tf(t)("buffer %q: %q does not contain %q", bufp, bufs[bufp], pred)
				}
			})
		default:
			panic("invalid checker " + checker[1])
		}
	}

	t.Run(testName, func(t *testing.T) {
		bufs := make(map[string]string, 3)
		for idx, f := range funcs {
			println(idx)
			f(t, bufs)
		}
	})
}
