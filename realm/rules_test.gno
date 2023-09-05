package chess

import (
	"fmt"
	"strings"
	"testing"
)

func move(from, to string) Move {
	return Move{
		From: SquareFromString(from),
		To:   SquareFromString(to),
	}
}

func TestCheckmate(t *testing.T) {
	fp := unsafeFEN("rn1qkbnr/pbpp1ppp/1p6/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1")
	m := move("f3", "f7")
	newp, ok := fp.ValidateMove(m)
	if !ok {
		t.Fatal("ValidateMove returned false")
	}
	mr := newp.IsFinished()
	if mr != Checkmate {
		t.Fatalf("expected Checkmate (%d), got %d", Checkmate, mr)
	}
}

func TestCheckmateFromFEN(t *testing.T) {
	fp := unsafeFEN("rn1qkbnr/pbpp1Qpp/1p6/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 1")
	mr := fp.IsFinished()
	if mr != Checkmate {
		t.Fatalf("expected Checkmate (%d), got %d", Checkmate, mr)
	}
}

func TestStalemate(t *testing.T) {
	fp := unsafeFEN("k1K5/8/8/8/8/8/8/1Q6 w - - 0 1")
	m := move("b1", "b6")
	newp, ok := fp.ValidateMove(m)
	if !ok {
		t.Fatal("ValidateMove rejected move")
	}
	mr := newp.IsFinished()
	if mr != Stalemate {
		t.Fatalf("expected Stalemate (%d), got %d", Stalemate, mr)
	}
}

// position shouldn't result in check/stalemate
// because pawn can move http://en.lichess.org/Pc6mJDZN#138
func TestNotMate(t *testing.T) {
	fp := unsafeFEN("8/3P4/8/8/8/7k/7p/7K w - - 2 70")
	m := move("d7", "d8")
	m.Promotion = PieceQueen
	newp, ok := fp.ValidateMove(m)
	if !ok {
		t.Fatal("ValidateMove returned false")
	}
	mr := newp.IsFinished()
	if mr != NotFinished {
		t.Fatalf("expected NotFinished (%d), got %d", NotFinished, mr)
	}
}

func TestXFoldRepetition(t *testing.T) {
	p := NewPosition()
	loop := [...]Move{
		move("g1", "f3"),
		move("g8", "f6"),
		move("f3", "g1"),
		move("f6", "g8"),
	}
	var valid bool
	for i := 0; i < 5; i++ {
		for j, m := range loop {
			p, valid = p.ValidateMove(m)
			if !valid {
				t.Fatalf("move %s not considered valid", m.String())
			}
			fini := p.IsFinished()
			switch {
			case (i == 3 && j == 3) || i == 4:
				// after the fourth full iteration, it should be marked as "drawn" for 5-fold.
				if fini != Drawn5Fold {
					t.Errorf("i: %d j: %d; expect %d got %d", i, j, Drawn5Fold, fini)
				}
			case (i == 1 && j == 3) || i >= 2:
				// After the second full iteration, IsFinished should mark this as "can 3 fold"
				if fini != Can3Fold {
					t.Errorf("i: %d j: %d; expect %d got %d", i, j, Can3Fold, fini)
				}
			default:
				if fini != NotFinished {
					t.Errorf("i: %d j: %d; expect %d got %d", i, j, NotFinished, fini)
				}
			}
		}
	}
}

func assertMoves(p Position, moves ...Move) Position {
	var valid bool
	for _, move := range moves {
		p, valid = p.ValidateMove(move)
		if !valid {
			panic("invalid move")
		}
	}
	return p
}

func TestXFoldRepetition2(t *testing.T) {
	// Like TestXFoldRepetition, but starts after the initial position.

	p := assertMoves(
		NewPosition(),
		move("f2", "f4"),
		move("c7", "c5"),
	)

	loop := [...]Move{
		move("g1", "f3"),
		move("g8", "f6"),
		move("f3", "g1"),
		move("f6", "g8"),
	}
	var valid bool
	for i := 0; i < 5; i++ {
		for j, m := range loop {
			p, valid = p.ValidateMove(m)
			if !valid {
				t.Fatalf("move %s not considered valid", m.String())
			}
			fini := p.IsFinished()
			switch {
			case i == 4:
				if fini != Drawn5Fold {
					t.Errorf("i: %d j: %d; expect %d got %d", i, j, Drawn5Fold, fini)
				}
			case i >= 2:
				if fini != Can3Fold {
					t.Errorf("i: %d j: %d; expect %d got %d", i, j, Can3Fold, fini)
				}
			default:
				if fini != NotFinished {
					t.Errorf("i: %d j: %d; expect %d got %d", i, j, NotFinished, fini)
				}
			}
		}
	}
}

func TestXMoveRule(t *testing.T) {
	p := NewPosition()

	p.HalfMoveClock = 99
	newp := assertMoves(p, move("g1", "f3"))
	fini := newp.IsFinished()
	if fini != Can50Move {
		t.Errorf("want %d got %d", Can50Move, fini)
	}

	p.HalfMoveClock = 149
	newp = assertMoves(p, move("g1", "f3"))
	fini = newp.IsFinished()
	if fini != Drawn75Move {
		t.Errorf("want %d got %d", Drawn75Move, fini)
	}
}

func TestPerft(t *testing.T) {
	moves := make([]Move, 0, 10)
	for n, res := range perfResults {
		t.Run(fmt.Sprintf("n%d", n), func(t *testing.T) {
			res.pos.Moves = append(moves[:0], res.pos.Moves...)
			counts := make([]int, len(res.nodesPerDepth))
			CountMoves(res.pos, len(res.nodesPerDepth), counts)
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

const perftDebug = false

func CountMoves(p Position, depth int, counts []int) {
	total := 0
	l := len(counts) - depth
	p.GenMoves(func(newp Position, m Move) error {
		counts[l]++
		if depth > 1 {
			countMoves(newp, depth-1, counts)
		}
		delta := counts[len(counts)-1] - total
		if perftDebug {
			fmt.Printf("%s%s: %d\n", m.From.String(), m.To.String(), delta)
		}
		total += delta
		return nil
	})
}

func countMoves(p Position, depth int, counts []int) {
	l := len(counts) - depth
	p.GenMoves(func(newp Position, m Move) error {
		counts[l]++
		if depth > 1 {
			countMoves(newp, depth-1, counts)
		}
		return nil
	})
}

type perfTest struct {
	pos           Position
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

func unsafeFEN(fen string) Position {
	p, e := decodeFEN(fen)
	if e != nil {
		panic(e)
	}
	return p
}

// Decodes FEN into Board and previous moves.
func decodeFEN(fen string) (p Position, err error) {
	fen = strings.TrimSpace(fen)
	parts := strings.Split(fen, " ")
	if len(parts) != 6 {
		err = fmt.Errorf("chess: fen invalid notation %s must have 6 sections", fen)
		return
	}

	p = NewPosition()

	// fen board
	var ok bool
	p.B, ok = fenBoard(parts[0])
	if !ok {
		err = fmt.Errorf("chess: invalid fen board %s", parts[0])
		return
	}

	// do castling rights first (more convenient to set prev)
	if parts[2] != "KQkq" {
		p.Flags = castleRightsToPositionFlags(parts[2])
	}

	// color to play
	color := Color(parts[1] == "b")
	if color == Black {
		// add fake move to make len(prev) odd
		p.Moves = append(p.Moves, Move{})
	}

	// en passant
	if parts[3] != "-" {
		f, e := parseEnPassant(parts[3])
		if e != nil {
			err = e
			return
		}
		p.Flags |= f
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
		rank := (7 - Square(idx)) << 3
		file := Square(0)
		for _, ch := range pieces {
			if ch >= '1' && ch <= '8' {
				delta := byte(ch) - '0'
				file += Square(delta)
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

func castleRightsToPositionFlags(cr string) (pf PositionFlags) {
	pf = NoCastleWQ | NoCastleWK | NoCastleBQ | NoCastleBK
	if cr == "-" {
		return
	}
	for _, ch := range cr {
		switch ch {
		case 'K':
			pf &^= NoCastleWK
		case 'Q':
			pf &^= NoCastleWQ
		case 'k':
			pf &^= NoCastleBK
		case 'q':
			pf &^= NoCastleBQ
		}
	}
	return
}

func parseEnPassant(strpos string) (PositionFlags, error) {
	eppos := SquareFromString(strpos)
	if eppos == SquareInvalid {
		return 0, fmt.Errorf("invalid pos: %s", eppos)
	}
	row, col := eppos.Split()
	if row != 5 && row != 2 {
		return 0, fmt.Errorf("invalid en passant pos: %s", eppos)
	}
	return EnPassant | PositionFlags(col), nil
}
