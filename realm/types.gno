package chess

// Board is a representation of a chess board.
// Details on how the position is encoded can be found at [Position].
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

func (b Board) ValidateMove(previous []Move, m Move) (newBoard Board, ok bool) {
	piece := b[m.From]

	isBlack := len(previous)%2 == 1
	if piece == PieceEmpty || piece.IsBlack() != isBlack {
		return b, false
	}

	switch piece &^ PieceBlack {
	case PiecePawn:
	case PieceRook:
	case PieceKnight:
	case PieceBishop:
	case PieceQueen:
	case PieceKing:
	}
}

// Piece represents a piece on the board.
type Piece byte

// used for quick-access
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

// Possible values of Piece. Within the context of Board, Piece is assumed to
// be white, unless p&PieceBlack != 0. Note PieceBlack is not a valid piece; it
// must be bitwise OR'd to a non-empty piece.
const (
	PieceEmpty Piece = 0

	PiecePawn
	PieceRook
	PieceKnight
	PieceBishop
	PieceQueen
	PieceKing

	PieceBlack Piece = 8 // bit-flag
)

// IsBlack returns whether the given piece is black.
func (p Piece) IsBlack() bool { return p&PieceBlack != 0 }

// Position encodes position information.
// Indexing 0 as the LSB, bits 0-3 indicate the column and bits 4-6 indicate
// the row. For instance, position 44 (decimal) is:
//
//	44 = 0b00 101  100  = d5
//	          ^row ^col
//
// (note: in algebraic notation, this is swapped: the letter represents the
// column, and the number represents the row).
type Position byte

// PositionFromString returns Position, reading the human-readable algebraic
// notation in s. s must be 2 bytes long, with the first byte a letter included
// between ['a'; 'h'], and the second a number included between ['1';'8'].
// If s is invalid, false is returned as the second argument.
func PositionFromString(s string) (p Position, valid bool) {
	if len(s) != 2 {
		return 0, false
	}
	col, row := s[0]-'a', s[1]-'1'
	// because s[0] is a byte, if s[0] < 'a' then the above will underflow and
	// row will be >= 8 (same for col).
	if row >= 8 || col >= 8 {
		return 0, false
	}
	return row<<3 | col, true
}

// Move represents a chess game move.
type Move struct {
	From, To Position

	// When pawn promotion happens, the piece the pawn is promoting to.
	Promotion Piece
}
