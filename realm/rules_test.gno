package chess

import (
	"fmt"
	"strings"
	"testing"
)

func TestPerft(t *testing.T) {
	moves := make([]Move, 0, 10)
	for n, res := range perfResults {
		t.Run(fmt.Sprintf("n%d", n), func(t *testing.T) {
			moves = append(moves[:0], res.pos.prev...)
			counts := make([]int, len(res.nodesPerDepth))
			countMoves(res.pos.b, moves, len(res.nodesPerDepth), counts)
			t.Logf("counts: %v", counts)
			if !intsMatch(counts, res.nodesPerDepth) {
				t.Errorf("counts don't match: got %v want %v", counts, res.nodesPerDepth)
			}
		})
	}
}

func intsMatch(xx, yy []int) bool {
	if len(xx) != len(yy) {
		return false
	}
	for i := range xx {
		if xx[i] != yy[i] {
			return false
		}
	}
	return true
}

func countMoves(b Board, prevMoves []Move, depth int, counts []int) {
	l := len(counts) - depth
	b.Moves(prevMoves, func(newb Board, m Move) error {
		counts[l]++
		if depth > 1 {
			countMoves(newb, append(prevMoves, m), depth-1, counts)
		}
		return nil
	})
}

type perfTest struct {
	pos           fenPos
	nodesPerDepth []int
}

/* https://www.chessprogramming.org/Perft_Results */
var perfResults = []perfTest{
	{pos: unsafeFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"), nodesPerDepth: []int{
		20, 400, 8902, // 197281,
		// 4865609, 119060324, 3195901860, 84998978956, 2439530234167, 69352859712417
	}},
	{pos: unsafeFEN("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"), nodesPerDepth: []int{
		48, 2039, 97862,
		// 4085603, 193690690
	}},
	{pos: unsafeFEN("8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"), nodesPerDepth: []int{
		14, 191, 2812, 43238, // 674624,
		// 11030083, 178633661
	}},
	{pos: unsafeFEN("r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1"), nodesPerDepth: []int{
		6, 264, 9467, // 422333,
		// 15833292, 706045033
	}},
	{pos: unsafeFEN("r2q1rk1/pP1p2pp/Q4n2/bbp1p3/Np6/1B3NBn/pPPP1PPP/R3K2R b KQ - 0 1"), nodesPerDepth: []int{
		6, 264, 9467, // 422333,
		// 15833292, 706045033
	}},
	{pos: unsafeFEN("rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8"), nodesPerDepth: []int{
		44, 1486, 62379,
		// 2103487, 89941194
	}},
	{pos: unsafeFEN("r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10"), nodesPerDepth: []int{
		46, 2079, // 89890,
		// 3894594, 164075551, 6923051137, 287188994746, 11923589843526, 490154852788714
	}},
}

// ---
// testing utility functions

// FEN decoding: see https://www.chessprogramming.org/Forsyth-Edwards_Notation
// copied mostly from notnil/chess and adapted to our own system.

type fenPos struct {
	b    Board
	prev []Move
}

func unsafeFEN(fen string) fenPos {
	b, p, e := decodeFEN(fen)
	if e != nil {
		panic(e)
	}
	return fenPos{b, p}
}

// Decodes FEN into Board and previous moves.
func decodeFEN(fen string) (b Board, prev []Move, err error) {
	fen = strings.TrimSpace(fen)
	parts := strings.Split(fen, " ")
	if len(parts) != 6 {
		err = fmt.Errorf("chess: fen invalid notation %s must have 6 sections", fen)
		return
	}

	// fen board
	var ok bool
	b, ok = fenBoard(parts[0])
	if !ok {
		err = fmt.Errorf("chess: invalid fen board %s", parts[0])
		return
	}

	// do castling rights first (more convenient to set prev)
	if parts[2] != "KQkq" {
		w, b := castleRightsToMoveFlags(parts[2])
		prev = append(prev, Move{Flags: w}, Move{Flags: b})
	}

	// color to play
	color := Color(parts[1] == "b")
	if color == Black {
		// add fake move to make len(prev) odd
		prev = append(prev, Move{})
	}

	// en passant
	if parts[3] != "-" {
		m, e := parseEnPassant(parts[3])
		if e != nil {
			err = e
			return
		}
		// add even number of moves, and set last move.
		prev = append(prev, Move{}, m)
	}

	// parts[4]: half move clock, todo after implementing 50/75-move rule
	// parts[5]: full move counter, probably never implementing

	return
}

// generates board from fen format: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
func fenBoard(boardStr string) (Board, bool) {
	rankStrs := strings.Split(boardStr, "/")
	if len(rankStrs) != 8 {
		return Board{}, false
	}
	var b Board
	for idx, pieces := range rankStrs {
		rank := (7 - Position(idx)) << 3
		file := Position(0)
		for _, ch := range pieces {
			if ch >= '1' && ch <= '8' {
				delta := byte(ch) - '0'
				file += Position(delta)
				if file > 8 {
					return b, false
				}
				continue
			}
			piece := p[byte(ch)]
			if piece == PieceEmpty || file >= 8 {
				return b, false
			}
			b[rank|file] = piece
			file++
		}
		if file != 8 {
			return b, false
		}
	}
	return b, true
}

const noCastle = MoveFlagNoCastleQ | MoveFlagNoCastleK

func castleRightsToMoveFlags(cr string) (w, b MoveFlags) {
	w, b = noCastle, noCastle
	if cr == "-" {
		return
	}
	for _, ch := range cr {
		switch ch {
		case 'K':
			w = w &^ MoveFlagNoCastleK
		case 'Q':
			w = w &^ MoveFlagNoCastleQ
		case 'k':
			b = b &^ MoveFlagNoCastleK
		case 'q':
			b = b &^ MoveFlagNoCastleQ
		}
	}
	return
}

func parseEnPassant(strpos string) (Move, error) {
	eppos := PositionFromString(strpos)
	if eppos == PositionInvalid {
		return Move{}, fmt.Errorf("invalid pos: %s", eppos)
	}
	row, col := eppos.Split()
	if row != 5 && row != 2 {
		return Move{}, fmt.Errorf("invalid en passant pos: %s", eppos)
	}
	// convert row to the row where the "pawn" has gone.
	if row == 5 {
		row--
	} else {
		row++
	}
	return Move{
		From:  0, // irrelevant
		To:    Position(row<<3 | col),
		Flags: MoveFlagCanEnPassant,
	}, nil
}
