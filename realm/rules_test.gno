package chess

import (
	"fmt"
	"strings"
	"testing"
)

func TestPerft(t *testing.T) {
	b := NewBoard()
	t.Logf("count: %d", countMoves(b, nil, 3))
}

func countMoves(b Board, prevMoves []Move, depth int) (count uint64) {
	b.Moves(prevMoves, func(newb Board, m Move) error {
		if depth == 1 {
			count++
		} else {
			count += countMoves(newb, append(prevMoves, m), depth-1)
		}
		return nil
	})
	return
}

// ---
// testing utility functions

// FEN decoding: see https://www.chessprogramming.org/Forsyth-Edwards_Notation
// copied mostly from notnil/chess and adapted to our own system.

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
