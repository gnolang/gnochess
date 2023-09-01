// This file is focused on elemental types and functions for handling
// chess games. Thus, the move legality rules are implemented here.
//
// To verify the following section, see the FIDE "Laws of Chess":
// https://www.fide.com/FIDE/handbook/LawsOfChess.pdf

package chess

import (
	"errors"
)

// Board is a representation of a chess board.
// Details on how to transform a chess algebraic position into an index
// can be found at [Square].
type Board [64]Piece

// NewBoard returns a Board normally set up at the initial position for standard
// chess.
func NewBoard() Board { return defaultBoard }

var defaultBoard = Board{
	// row 1
	p['R'], p['N'], p['B'], p['Q'],
	p['K'], p['B'], p['N'], p['R'],
	// row 2
	p['P'], p['P'], p['P'], p['P'],
	p['P'], p['P'], p['P'], p['P'],

	// rows 3, 4, 5, 6
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,

	// row 7
	p['p'], p['p'], p['p'], p['p'],
	p['p'], p['p'], p['p'], p['p'],
	// row 8
	p['r'], p['n'], p['b'], p['q'],
	p['k'], p['b'], p['n'], p['r'],
}

func sign(n int8) int8 {
	switch {
	case n > 0:
		return 1
	case n < 0:
		return -1
	default:
		return 0
	}
}

func abs(n int8) int8 {
	return n * sign(n)
}

// ValidateMove checks whether the given move is legal in Chess.
//
// Caller guarantees:
//
//   - len(previous) must be even for white moves, odd for black moves.
//   - m may not be nil.
//   - m.To and m.From must be valid (<64).
//
// ValidateMove may modify m.Flags, hence the pointer.
func (b Board) ValidateMove(previous []Move, m *Move) (newBoard Board, ok bool) {
	if b[m.To].StripColor() == PieceKing {
		return
	}

	return b.validateMove(previous, m)
}

// validateMove allows for m to be a "king-capture" move, which is illegal in
// chess, but it is useful for InCheck.
func (b Board) validateMove(previous []Move, m *Move) (newBoard Board, ok bool) {
	piece := b[m.From]
	newBoard = b

	// piece moved must be of player's color
	color := Color(len(previous)%2 == 1)
	if piece == PieceEmpty || piece.Color() != color ||
		// additionally, check piece has actually moved
		m.From == m.To {
		return
	}
	// destination must not be occupied by piece of same color
	if to := b[m.To]; to != PieceEmpty && to.Color() == color {
		return
	}

	// one of the two necessarily != 0 (consequence of m.From != m.To).
	delta := m.From.Sub(m.To)
	dr, dc := delta[0], delta[1]

	isDiag := func() bool {
		// move diagonally (|dr| == |dc|)
		if abs(dr) != abs(dc) {
			return false
		}
		signr, signc := sign(dr), sign(dc)
		// squares crossed must be empty
		for i := int8(1); i < abs(dr); i++ {
			if b[m.From.Move(i*signr, i*signc)] != PieceEmpty {
				return false
			}
		}
		return true
	}
	isHorizVert := func() bool {
		// only one of dr, dc must be 0 (horiz/vert movement)
		if dr != 0 && dc != 0 {
			return false
		}
		// squares crossed must be empty
		for i := int8(1); i < abs(dr); i++ {
			if b[m.From.Move(i*sign(dr), 0)] != PieceEmpty {
				return false
			}
		}
		for i := int8(1); i < abs(dc); i++ {
			if b[m.From.Move(0, i*sign(dc))] != PieceEmpty {
				return false
			}
		}
		return true
	}

	switch piece.StripColor() {
	case PieceRook:
		if !isHorizVert() {
			return
		}
		// if rook has moved from a starting position, this disables castling
		// on the side of the rook. flag accordingly in the move.
		var fg Square
		if color == Black {
			fg = 7 << 3
		}
		switch m.From {
		case fg: // a rook (either side)
			m.Flags |= MoveFlagNoCastleQ
		case fg | 7: // h rook (either side)
			m.Flags |= MoveFlagNoCastleK
		}

	case PieceKnight:
		// move L-shaped
		// rationale: if you only have positive integers, the only way you can
		// obtain x * y == 2 is if x,y are either 1,2 or 2,1.
		if abs(dc*dr) != 2 {
			return
		}

	case PieceBishop:
		if !isDiag() {
			return
		}

	case PieceQueen:
		if !isHorizVert() && !isDiag() {
			return
		}

	case PieceKing:
		// castling
		if abs(dc) == 2 && dr == 0 {
			// determine if castle is a valid form of castling for the given color
			ctype := m.isCastle(color)
			if ctype == 0 {
				return
			}

			if false ||
				// check that there are no previous moves which disable castling
				castlingDisabled(previous, color, ctype) ||
				// check that we have the exact board set ups we need
				// + make sure that the original and crossed squares are not in check
				!b.checkCastlingSetup(color, ctype) {
				return
			}

			// perform rook move here
			newBoard = newBoard.castleRookMove(color, ctype)
			// add NoCastle flags to prevent any further castling
			m.Flags |= MoveFlagNoCastleQ | MoveFlagNoCastleK
			break
		}
		// move 1sq in all directions
		if dc < -1 || dc > 1 || dr < -1 || dr > 1 {
			return
		}
		// king has moved: disable castling.
		m.Flags |= MoveFlagNoCastleQ | MoveFlagNoCastleK

	case PiecePawn:
		// determine direction depending on color
		dir := int8(1)
		if color == Black {
			dir = -1
		}

		switch {
		case dc == 0 && dr == dir: // 1sq up
			// destination must be empty (no captures allowed)
			if b[m.To] != PieceEmpty {
				return
			}
		case dc == 0 && dr == dir*2: // 2sq up (only from starting row)
			wantRow := Square(1)
			if color == Black {
				wantRow = 6
			}
			// check starting row, and that two squares are empty
			if (m.From>>3) != wantRow ||
				b[m.From.Move(int8(dir), 0)] != PieceEmpty ||
				b[m.To] != PieceEmpty {
				return
			}
			m.Flags |= MoveFlagCanEnPassant
		case abs(dc) == 1 && dr == dir: // capture on diag
			// must be a capture
			if b[m.To] == PieceEmpty {
				if sq := checkEnPassant(previous, color, m.To); sq != SquareInvalid {
					// remove other pawn
					newBoard[sq] = PieceEmpty
					break
				}
				return
			}
			// b[m.To] is necessarily an opponent piece; we check & return
			// b[m.To].Color == color at the beginning of the fn.
		default: // not a recognized move
			return
		}

		row := m.To >> 3
		if (color == White && row == 7) ||
			(color == Black && row == 0) {
			// promotion required
			if m.Flags&MoveFlagPromotion == 0 {
				// m.To is a king? then this is a pseudo-move check.
				// fix the flags.
				if b[m.To].StripColor() == PieceKing {
					m.Flags |= MoveFlagPromotion | MoveFlags(PieceQueen)
				} else {
					return
				}
			}
			pc := m.Flags & 7
			if pc == 0 || pc == 7 { // invalid pieces
				return
			}
			newBoard[m.From] = Piece(pc) | color.Piece()
		}
	}

	to := newBoard[m.To]
	if to.StripColor() == PieceKing {
		// King captures don't check for our own king in check;
		// these are only "theoretical" moves.
		return newBoard, true
	}

	// perform board mutation
	newBoard[m.From], newBoard[m.To] = PieceEmpty, newBoard[m.From]

	// is our king in check, as a result of the current move?
	if newBoard.InCheck(color) {
		return
	}
	return newBoard, true
}

var blackPastMoves = []Move{
	{From: SquareInvalid, To: SquareInvalid},
}

// InCheck checks whether the king with the given color is in check.
// If such king does not exist on the board, InCheck returns false.
//
// A king is in check if the move from a piece of the other color
// towards the king is valid, ignoring any checks on the other color's king.
//
// NOTE: the last remark is important:
// https://lichess.org/analysis/4k3/8/4b3/8/8/8/K3R3/8_w_-_-_0_1?color=white
// -- this is still a check for white, even if _technically_ black couldn't
// move the bishop (as that would check its own king)
func (b Board) InCheck(color Color) bool {
	pWant := PieceKing | color.Piece()
	kingp := b.findPiece(pWant)
	if kingp == SquareInvalid {
		// king doesn't exist (likely recursive InCheck call)
		return false
	}

	// use pastMoves to make validateMove check for the right color.
	// in the for-loop, we'll be simulating a move done by the color
	// opposite ours. => if our color is white, the simulated move is black
	// => len(pastMoves) == 1
	var pastMoves []Move
	if color == White {
		pastMoves = blackPastMoves
	}

	for sq, piece := range b {
		if piece == PieceEmpty || piece.Color() == color {
			continue
		}
		_, ok := b.validateMove(pastMoves, &Move{
			From: Square(sq),
			To:   kingp,
			// validateMove (unexp) understands that moves to capture a king are
			// "theoretical", so it doesn't check for checking on its own king,
			// or promotion.
		})
		if ok {
			return true
		}
	}

	return false
}

func (b Board) findPiece(pWant Piece) Square {
	for sq, p := range b {
		if p == pWant {
			return Square(sq)
		}
	}
	return SquareInvalid
}

func (b Board) checkCastlingSetup(c Color, typ byte) bool {
	// set up correct row and piece flags according to color
	var fg Square
	var pfg Piece
	if c == Black {
		fg, pfg = 7<<3, PieceBlack
	}

	// cross are the squares that the king starts from,
	// crosses and "lands". they are recorded as they must all be
	// not in check by any opponent piece.
	var cross [3]Square

	if typ == 'K' {
		if !(b[fg|4] == pfg|PieceKing &&
			b[fg|5] == PieceEmpty &&
			b[fg|6] == PieceEmpty &&
			b[fg|7] == pfg|PieceRook) {
			return false
		}
		cross = [3]Square{fg | 4, fg | 5, fg | 6}
	} else {
		if !(b[fg|4] == pfg|PieceKing &&
			b[fg|3] == PieceEmpty &&
			b[fg|2] == PieceEmpty &&
			b[fg|1] == PieceEmpty &&
			b[fg|0] == pfg|PieceRook) {
			return false
		}
		cross = [3]Square{fg | 4, fg | 3, fg | 2}
	}

	testb := b
	for _, sq := range cross {
		testb[sq] = pfg | PieceKing
		if testb.InCheck(c) {
			return false
		}
		testb[sq] = PieceEmpty
	}

	return true
}

func (b Board) castleRookMove(c Color, typ byte) Board {
	var fg Square
	var pfg Piece
	if c == Black {
		fg, pfg = 7<<3, PieceBlack
	}

	if typ == 'K' {
		b[fg|7], b[fg|5] = PieceEmpty, PieceRook|pfg
	} else {
		b[fg|0], b[fg|3] = PieceEmpty, PieceRook|pfg
	}
	return b
}

func checkEnPassant(previous []Move, c Color, sq Square) Square {
	row, col := sq.Split()
	if (c == White && row != 5) ||
		(c == Black && row != 2) ||
		len(previous) == 0 {
		return SquareInvalid
	}
	last := previous[len(previous)-1]
	if last.Flags&MoveFlagPromotion != 0 ||
		last.Flags&MoveFlagCanEnPassant == 0 {
		return SquareInvalid
	}
	_, lc := last.To.Split()
	if col != lc {
		return SquareInvalid
	}
	return last.To
}

// Moves implements a rudimentary move generator.
// This is not used beyond aiding in determing stalemate and doing perft tests.
// Each generated move is passed to cb.
// If cb returns an error, it is returned without processing further moves.
func (b Board) Moves(previous []Move, cb func(Board, Move) error) error {
	color := Color(len(previous)%2 == 1)
	for sq, piece := range b {
		if piece == PieceEmpty || piece.Color() != color {
			continue
		}

		from := Square(sq)

		p := piece.StripColor()
		// If the piece is a pawn, and they are on the second last row, we know
		// that whatever move they do (advance, or take diagonally) they're going
		// to promote.
		prom := p == PiecePawn &&
			((color == White && from>>3 == 6) ||
				(color == Black && from>>3 == 1))

		// delta generator needs to know if p is black
		if p == PiecePawn && color == Black {
			p |= Black.Piece()
		}

		var err error
		deltaGenerator(p, func(delta Delta) byte {
			// create move; if the resulting square is oob, continue
			m := Move{
				From: from,
				To:   from.Apply(delta),
			}
			if m.To == SquareInvalid ||
				(b[m.To] != PieceEmpty && b[m.To].Color() == color) {
				return deltaGenStopLinear
			}

			// handle promotion case
			if prom {
				m.Flags = MoveFlagPromotion | MoveFlags(PieceQueen)
			}

			// if it's a valid move, call cb on it
			newb, ok := b.ValidateMove(previous, &m)
			if !ok {
				return deltaGenOK
			}
			if err = cb(newb, m); err != nil {
				return deltaGenStop
			}

			// if we've promoted, handle the cases where we've promoted to a non-queen.
			if !prom {
				return deltaGenOK
			}

			for _, p := range [...]Piece{PieceRook, PieceKnight, PieceBishop} {
				newb[m.To] = p | color.Piece()
				m.Flags = (m.Flags &^ 7) | MoveFlags(p)
				if err = cb(newb, m); err != nil {
					return deltaGenStop
				}
			}
			return deltaGenOK
		})
		if err != nil {
			return err
		}
	}
	return nil
}

const (
	// carry on normally
	deltaGenOK = iota
	// if the generator is doing a linear attack (ie. rook, bishop, queen),
	// then stop that (there is a piece of same colour in the way.)
	deltaGenStopLinear
	// abort generation asap.
	deltaGenStop
)

/*func init() {
	for i := PiecePawn; i <= PieceKing; i++ {
		println("generator ", i.String())
		deltaGenerator(i, func(d Delta) byte {
			println("  ", d[0], d[1])
			return deltaGenOK
		})
	}
}*/

// deltaGenerator generates the possible ways in which p can move.
// the callback may return one of the three deltaGen* values.
func deltaGenerator(p Piece, cb func(d Delta) byte) {
	doLinear := func(d Delta) bool {
		for i := int8(1); i <= 7; i++ {
			switch cb(d.Mul(i)) {
			case deltaGenStopLinear:
				return false
			case deltaGenStop:
				return true
			}
		}
		return false
	}
	rotate := func(d Delta, lin bool) bool {
		for i := 0; i < 4; i++ {
			if lin {
				if doLinear(d) {
					return true
				}
			} else {
				if cb(d) == deltaGenStop {
					return true
				}
			}

			d = d.Rot()
		}
		return false
	}

	// In the following, we use logical OR's to do conditional evaluation
	// (if the first item returns true, the second won't be evaluated)
	switch p {
	case PiecePawn, PiecePawn | PieceBlack:
		dir := int8(1)
		if p.Color() == Black {
			dir = -1
		}
		// try moving 1sq forward; if we get StopLinear, don't try to do 2sq.
		fw := cb(Delta{dir, 0})
		if fw == deltaGenStop {
			return
		}
		if fw != deltaGenStopLinear {
			if cb(Delta{dir * 2, 0}) == deltaGenStop {
				return
			}
		}

		_ = cb(Delta{dir, 1}) == deltaGenStop ||
			cb(Delta{dir, -1}) == deltaGenStop

	case PieceRook:
		rotate(Delta{0, 1}, true)
	case PieceBishop:
		rotate(Delta{1, 1}, true)
	case PieceKnight:
		_ = rotate(Delta{1, 2}, false) ||
			rotate(Delta{2, 1}, false)
	case PieceQueen:
		_ = rotate(Delta{0, 1}, true) ||
			rotate(Delta{1, 1}, true)
	case PieceKing:
		_ = rotate(Delta{0, 1}, false) ||
			rotate(Delta{1, 1}, false) ||
			cb(Delta{0, 2}) == deltaGenStop ||
			cb(Delta{0, -2}) == deltaGenStop
	}
}

type MateResult byte

const (
	NoMate MateResult = iota
	Checkmate
	Stalemate
)

var errFound = errors.New("found")

// IsMate determines whether the game, at c's turn, is in either check-
// or stalemate.
func (b Board) IsMate(prev []Move) MateResult {
	err := b.Moves(prev, func(Board, Move) error {
		return errFound
	})
	// If there is any legal move, this is not any kind of mate.
	if err != nil {
		return NoMate
	}

	// No legal moves. Is the king in check?
	if b.InCheck(Color(len(prev)%2 == 1)) {
		return Checkmate
	}
	return Stalemate
}

// Color determines a player's color -- either white or black.
type Color bool

const (
	White Color = false
	Black Color = true
)

// Piece returns the color as a piece to be OR'd into a Piece;
// ie. 0 on White, and [PieceBlack] on black.
func (c Color) Piece() Piece {
	if c == White {
		return 0
	}
	return PieceBlack
}

// Piece represents a piece on the board.
type Piece byte

// piece character to internal piece
var p = [256]Piece{
	'P': PiecePawn,
	'R': PieceRook,
	'N': PieceKnight,
	'B': PieceBishop,
	'Q': PieceQueen,
	'K': PieceKing,

	'p': PieceBlack | PiecePawn,
	'r': PieceBlack | PieceRook,
	'n': PieceBlack | PieceKnight,
	'b': PieceBlack | PieceBishop,
	'q': PieceBlack | PieceQueen,
	'k': PieceBlack | PieceKing,
}

var pstring = [PieceBlack | PieceKing + 1]byte{
	PiecePawn:                'P',
	PieceRook:                'R',
	PieceKnight:              'N',
	PieceBishop:              'B',
	PieceQueen:               'Q',
	PieceKing:                'K',
	PieceBlack | PiecePawn:   'p',
	PieceBlack | PieceRook:   'r',
	PieceBlack | PieceKnight: 'n',
	PieceBlack | PieceBishop: 'b',
	PieceBlack | PieceQueen:  'q',
	PieceBlack | PieceKing:   'k',
}

func (p Piece) String() string {
	if int(p) >= len(pstring) {
		return ""
	}
	v := pstring[p]
	if v == 0 {
		return ""
	}
	return string(v)
}

// Possible values of Piece. Within the context of Board, Piece is assumed to
// be white, unless p&PieceBlack != 0. Note PieceBlack is not a valid piece; it
// must be bitwise OR'd to a non-empty piece.
const (
	PieceEmpty Piece = iota

	PiecePawn
	PieceRook
	PieceKnight
	PieceBishop
	PieceQueen
	PieceKing

	PieceBlack Piece = 8 // bit-flag
)

// Color returns the color of the piece.
func (p Piece) Color() Color { return Color(p&PieceBlack != 0) }

// Piece returns the given Piece without color information.
func (p Piece) StripColor() Piece { return p &^ PieceBlack }

// Switch switches the color of the given piece.
func (p Piece) Switch() Piece {
	if p.Color() == Black {
		return p &^ PieceBlack
	}
	return p | PieceBlack
}

// Delta represents a 2d vector for indicating a movement from one square
// to another. The first value indicates the change in column, the second the
// change in rows.
type Delta [2]int8

// Valid ensures the two values of delta are valid.
func (d Delta) Valid() bool {
	return d[0] >= -7 && d[0] <= 7 &&
		d[1] >= -7 && d[1] <= 7 &&
		!(d[0] == 0 && d[1] == 0)
}

// Rot applies a 90 degree anti-clockwise rotation to d.
func (d Delta) Rot() Delta {
	// Rationale: this is just matrix-vector multiplication.
	// 90 deg rotation is just the matrix {0, -1; 1, 0}.
	return Delta{d[1], -d[0]}
}

// Mul multiplies both values by n, otherwise known as scalar product.
func (d Delta) Mul(n int8) Delta {
	return Delta{d[0] * n, d[1] * n}
}

// Square encodes piece position information, in chess the "square" the piece is on.
// Indexing 0 as the LSB, bits 0-3 indicate the column and bits 4-6 indicate
// the row. For instance, square 44 (decimal) is:
//
//	44 = 0b00 101  100  = d5
//	          ^row ^col
//
// (note: in algebraic notation, this is swapped: the letter represents the
// column, and the number represents the row).
type Square byte

// SquareInvalid is returned by some Square-related methods to indicate
// invalid parameters.
const SquareInvalid Square = 255

// String returns p in algebraic notation.
func (q Square) String() string {
	if q >= 64 {
		return "<invalid>"
	}
	return string(q&7+'a') + string(q>>3+'1')
}

// SquareFromString returns Square, reading the human-readable algebraic
// notation in s. s must be 2 bytes long, with the first byte a letter included
// between ['a'; 'h'], and the second a number included between ['1';'8'].
// If s is invalid, SquareInvalid is returned.
func SquareFromString(s string) Square {
	if len(s) != 2 {
		return SquareInvalid
	}
	col, row := s[0]-'a', s[1]-'1'
	// because s[0] is a byte, if s[0] < 'a' then the above will underflow and
	// row will be >= 8 (same for col).
	if row >= 8 || col >= 8 {
		return SquareInvalid
	}
	return Square(row<<3 | col)
}

// Move changes the square of q, moving it vertically according to dr
// (delta row) and horizontally according to dc (delta column).
// If the resulting square is not on the board, then SquareInvalid is returned.
func (q Square) Move(dr, dc int8) Square {
	if q == SquareInvalid || !(Delta{dr, dc}).Valid() {
		return SquareInvalid
	}

	row, col := int8(q>>3), int8(q&7)
	row += dr
	col += dc

	nr, nc := Square(row), Square(col)
	if nr >= 8 || nc >= 8 {
		return SquareInvalid
	}
	return nr<<3 | nc
}

// Apply applies the given delta to the square.
// It is shorthand for q.Move(d[0], d[1]).
func (q Square) Apply(d Delta) Square { return q.Move(d[0], d[1]) }

// Split splits Square into its components.
// This function does not check if p is invalid.
func (q Square) Split() (row, col byte) {
	return byte(q >> 3), byte(q & 7)
}

// SplitI works like [Square.Split], but returns int8's instead
// of bytes.
func (q Square) SplitI() (row, col int8) {
	return int8(q >> 3), int8(q & 7)
}

// Sub calculates the difference between the two squares.
// q is the originating square, s is the ending square. The difference in
// rows and columns from q to s is returned; for instance, d1.Sub(a4) yields
// Delta{3, -3}.
func (q Square) Sub(s Square) Delta {
	fr, fc := q.SplitI()
	tr, tc := s.SplitI()
	return Delta{tr - fr, tc - fc}
}

// Move represents a chess game move.
type Move struct {
	From, To Square
	Flags    MoveFlags
}

var (
	castleWhiteQ = Move{From: SquareFromString("e1"), To: SquareFromString("c1")}
	castleWhiteK = Move{From: SquareFromString("e1"), To: SquareFromString("g1")}
	castleBlackQ = Move{From: SquareFromString("e8"), To: SquareFromString("c8")}
	castleBlackK = Move{From: SquareFromString("e8"), To: SquareFromString("g8")}
)

// returns 0, 'K' or 'Q'.
func (m Move) isCastle(c Color) (kind byte) {
	if c == White {
		switch m {
		case castleWhiteQ:
			return 'Q'
		case castleWhiteK:
			return 'K'
		}
	} else {
		switch m {
		case castleBlackQ:
			return 'Q'
		case castleBlackK:
			return 'K'
		}
	}
	return 0
}

func castlingDisabled(moves []Move, c Color, kind byte) bool {
	if kind != 'K' && kind != 'Q' {
		return false
	}

	// Determine what flag we're looking for.
	want := MoveFlagNoCastleK
	if kind == 'Q' {
		want = MoveFlagNoCastleQ
	}

	// Search only through even/odd moves according to color.
	off := 0
	if c == Black {
		off = 1
	}

	// Iterate until we find a move with the flags we want.
	for i := off; i < len(moves); i += 2 {
		f := moves[i].Flags
		if f&MoveFlagPromotion == 0 && f&want != 0 {
			return true
		}
	}

	return false
}

// MoveFlags represents bit-flags in a move.
type MoveFlags byte

// NOTE: only ones which can happen together are MoveFlagNoCastleQ and
// MoveFlagNoCastleK.
const (
	// Indicates moves which forbid subsequent Queenside or Kingside castling.
	MoveFlagNoCastleQ MoveFlags = 1 << iota
	MoveFlagNoCastleK

	// Indicates a two-square ahead move by a pawn; thus for the move
	// immediately afterwards the pawn can be taken by a parallel opponent pawn
	// through an en passant capture.
	MoveFlagCanEnPassant

	// Indicates pawn promotion. First three bits become the value of the
	// corresponding Piece.
	MoveFlagPromotion
)
