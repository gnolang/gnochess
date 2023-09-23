// This file is focused on elemental types and functions for handling
// chess games. Thus, the move legality rules are implemented here.
//
// To verify the following section, see the FIDE "Laws of Chess":
// https://www.fide.com/FIDE/handbook/LawsOfChess.pdf

package chess

import (
	"errors"
	"sort"
	"strconv"
	"strings"
)

// PositionFlags. The lower 4 bits indicate an en passant column; the upper
// 4 indicate castling rights.
type PositionFlags byte

const (
	EnPassant PositionFlags = 1 << (iota + 3)
	NoCastleWQ
	NoCastleWK
	NoCastleBQ
	NoCastleBK

	MaskEnPassant = 7 // low 4 bits
)

// CastlingRights returns FEN castling rights.
// https://www.chessprogramming.org/Forsyth-Edwards_Notation#Castling_ability
func (p PositionFlags) CastlingRights() string {
	s := ""
	if p&NoCastleWK == 0 {
		s += "K"
	}
	if p&NoCastleWQ == 0 {
		s += "Q"
	}
	if p&NoCastleBK == 0 {
		s += "k"
	}
	if p&NoCastleBQ == 0 {
		s += "q"
	}
	if s == "" {
		return "-"
	}
	return s
}

// Position contains the information about a chessboard, and surrounding
// context: the previous moves, the castling rights and "en passant" column.
type Position struct {
	B     Board
	Moves []Move
	Flags PositionFlags

	// Halfmoves since the last pawn move or capture.
	// https://www.chessprogramming.org/Halfmove_Clock
	HalfMoveClock uint16
}

// NewPosition returns a new Position, set up with the initial board position.
func NewPosition() Position {
	return Position{
		B:     NewBoard(),
		Moves: make([]Move, 0, 80), // typical chess game is ~40 moves, 80 half-moves
	}
}

func (p Position) clone() Position {
	// from bugs:
	// https://github.com/gnolang/gno/issues/1096
	// https://github.com/gnolang/gno/issues/1097
	// ideally, since we're always using Position as a value, not a reference,
	// we don't need this.

	b, m, f, hmc, h := p.B, p.Moves, p.Flags, p.HalfMoveClock, p.Hashes
	return Position{b, m, f, hmc, h}
}

// Color of the "next" move after p.Moves. (White for even len(p.Moves),
// Black otherwise)
func (p Position) Color() Color { return Color(len(p.Moves)&1 == 1) }

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

// EncodeFEN encodes p into FEN.
// https://www.chessprogramming.org/Forsyth-Edwards_Notation
func (p Position) EncodeFEN() string {
	var s string
	emptyCount := 0
	// FEN has different ordering from us, as [0] is a black rook while for us
	// is a white rook. So we need to invert the order of rows.
	for i := 56; i >= 0; i++ {
		v := p.B[i]
		if v == PieceEmpty {
			emptyCount++
			if i%8 == 7 {
				s += strconv.Itoa(emptyCount) + "/"
				emptyCount = 0
				i -= 16
			}
			continue
		}
		if emptyCount > 0 {
			s += strconv.Itoa(emptyCount)
			emptyCount = 0
		}
		s += v.String()
		if i%8 == 7 {
			s += "/"
			i -= 16
		}
	}
	// remove trailing slash
	s = s[:len(s)-1]

	strs := []string{
		s,                        // 0: piece placement
		"w",                      // 1: side to move
		p.Flags.CastlingRights(), // 2: castling ability
		"-",                      // 3: e.p. target square

		strconv.Itoa(int(p.HalfMoveClock)), // 4: halfmove clock
		strconv.Itoa(len(p.Moves)/2 + 1),   // 5: fullmove counter
	}

	var epFile byte
	if p.Flags&EnPassant > 0 {
		epFile = 'a' + byte(p.Flags&MaskEnPassant)
	}

	if p.Color() == Black {
		strs[1] = "b"
		if epFile != 0 {
			strs[3] = string(epFile) + "3"
		}
	} else if epFile != 0 {
		strs[3] = string(epFile) + "6"
	}

	return strings.Join(strs, " ")
}

// ValidateMove checks whether the given move is legal in Chess.
//
// Caller must guarantee m.To and m.From to be valid (<64).
func (p Position) ValidateMove(m Move) (newP Position, valid bool) {
	// XXX: This below is a Gno bug! In Go we don't need to do this (Position is
	// a value, not a reference), but in Gno there is a bug whereby the underlying
	// p still holds (some) references.
	// Just a small reminder that the software is not _beta_ quality, it's
	// very, very alpha, and it's a shame the Greek alphabet doesn't allow me
	// to go backwards to express how early in development we still are.
	p := oldp.clone()

	if p.B[m.To].StripColor() == PieceKing {
		return
	}

	piece := p.B[m.From]

	// piece moved must be of player's color
	color := p.Color()
	if piece == PieceEmpty || piece.Color() != color ||
		// additionally, check piece has actually moved
		m.From == m.To {
		return
	}
	// destination must not be occupied by piece of same color
	if to := p.B[m.To]; to != PieceEmpty && to.Color() == color {
		return
	}

	// one of the two necessarily != 0 (consequence of m.From != m.To).
	delta := m.From.Sub(m.To)
	dr, dc := delta[0], delta[1]

	// Keep old castling rights; remove en passant info.
	newFlags := p.Flags &^ (MaskEnPassant | EnPassant)
	// Marked as true for succesful promotions.
	var promoted bool

	switch piece.StripColor() {
	case PieceRook:
	case PieceKnight:
	case PieceBishop:
	case PieceQueen:
	case PieceKing:
	case PiecePawn:
	}

	if p.B[m.To].StripColor() == PieceKing {
		// King captures don't check for our own king in check;
		// these are only "theoretical" moves.
		return Position{}, true
	}

	// perform board mutation
	capture := p.B[m.To] != PieceEmpty
	p.B[m.From], p.B[m.To] = PieceEmpty, p.B[m.From]
	p.Flags = newFlags
	p.Moves = append(p.Moves, m)

	// halfmove clock + hashes logic
	if piece.StripColor() == PiecePawn || capture {
		// reset both
		p.HalfMoveClock = 0
		p.Hashes = nil
	} else {
		p.HalfMoveClock++
	}
	ep := byte(255)
	if p.Flags&EnPassant != 0 {
		ep = byte(p.Flags & MaskEnPassant)
	}

	// is our king in check, as a result of the current move?
	if p.B.InCheck(color) {
		return
	}
	return p, true
}

// used by InCheck to simulate a move by black player.
var blackPrevMoves = make([]Move, 1)

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
		return false
	}

	pos := Position{B: b}
	if color == White {
		// color == White -> simulate a move by black player -> pos.Moves odd
		pos.Moves = blackPrevMoves
	}

	for sq, piece := range b {
		if piece == PieceEmpty || piece.Color() == color {
			continue
		}
		_, ok := pos.validateMove(Move{
			From: Square(sq),
			To:   kingp,
			// validateMove (unexp) understands that moves to capture a king are
			// pseudo moves, so it doesn't check for checking on its own king,
			// or promotion.
		})
		if ok {
			return true
		}
	}

	return false
}

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

func (b Board) findPiece(pWant Piece) Square {
	for sq, p := range b {
		if p == pWant {
			return Square(sq)
		}
	}
	return SquareInvalid
}

func (p Position) checkCastlingSetup(typ byte) bool {
	// set up correct row and piece flags according to color
	c := p.Color()
	b := p.B
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

	testb := p.B
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

func (p Position) castlingDisabled(color Color, kind byte) bool {
	if kind != 'K' && kind != 'Q' {
		return false
	}

	// Determine what flag we're looking for.
	var want PositionFlags
	switch {
	case color == White && kind == 'K':
		want = NoCastleWK
	case color == White && kind == 'Q':
		want = NoCastleWQ
	case color == Black && kind == 'K':
		want = NoCastleBK
	case color == Black && kind == 'Q':
		want = NoCastleBQ
	}

	return p.Flags&want != 0
}

func (p Position) checkEnPassant(c Color, sq Square) Square {
	row, col := sq.Split()
	if p.Flags&EnPassant == 0 ||
		(c == White && row != 5) ||
		(c == Black && row != 2) {
		return SquareInvalid
	}
	wantCol := byte(p.Flags & MaskEnPassant)

	if col != wantCol {
		return SquareInvalid
	}

	if c == White {
		return Square(4<<3 | col)
	}
	return Square(3<<3 | col)
}

// GenMoves implements a rudimentary move generator.
// This is not used beyond aiding in determing stalemate and doing perft tests.
// Each generated move is passed to cb.
// If cb returns an error, it is returned without processing further moves.
func (p Position) GenMoves(cb func(Position, Move) error) error {
	color := p.Color()
	for sq, piece := range p.B {
		if piece == PieceEmpty || piece.Color() != color {
			continue
		}

		from := Square(sq)

		pstrip := piece.StripColor()
		// If the piece is a pawn, and they are on the second last row, we know
		// that whatever move they do (advance, or take diagonally) they're going
		// to promote.
		prom := pstrip == PiecePawn &&
			((color == White && from>>3 == 6) ||
				(color == Black && from>>3 == 1))

		// delta generator needs to know if p is black
		if pstrip == PiecePawn && color == Black {
			pstrip |= Black.Piece()
		}

		var err error
		deltaGenerator(pstrip, func(delta Delta) byte {
			// create move; if the resulting square is oob, continue
			m := Move{
				From: from,
				To:   from.Apply(delta),
			}
			if m.To == SquareInvalid ||
				(p.B[m.To] != PieceEmpty && p.B[m.To].Color() == color) {
				return deltaGenStopLinear
			}

			// handle promotion case
			if prom {
				m.Promotion = PieceQueen
			}

			// if it's a valid move, call cb on it
			newp, ok := p.ValidateMove(m)
			if !ok {
				return deltaGenOK
			}
			if err = cb(newp, m); err != nil {
				return deltaGenStop
			}

			// if we've promoted, handle the cases where we've promoted to a non-queen.
			if !prom {
				return deltaGenOK
			}

			for _, promPiece := range [...]Piece{PieceRook, PieceKnight, PieceBishop} {
				newp.B[m.To] = promPiece | color.Piece()
				m.Promotion = promPiece
				if err = cb(newp, m); err != nil {
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
	From, To  Square
	Promotion Piece
}

// String returns a string representation of Move.
// It is in the form of "Long Algebraic Notation".
// https://backscattering.de/chess/uci/#move-lan
func (m Move) String() string {
	p := ""
	if m.Promotion != 0 {
		p = string(m.Promotion.String()[0] + ('a' - 'A'))
	}
	return m.From.String() + m.To.String() + p
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
