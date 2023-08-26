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
func (b Board) ValidateMove(previous []Move, m Move) (newBoard Board, ok bool) {
	piece := b[m.From]
	newBoard = b

	// piece moved must be of player's colour
	isBlack := len(previous)%2 == 1
	if piece == PieceEmpty || piece.IsBlack() != isBlack ||
		// additionally, check piece has actually moved
		m.From == m.To {
		return
	}
	// destination must not be occupied by piece of same colour
	if to := board[m.To]; to != PositionEmpty && to.IsBlack() == isBlack {
		return
	}

	// one of the two necessarily != 0.
	dr, dc := func() (int8, int8) {
		fr, fc := m.From.SplitI()
		tr, tc := m.To.SplitI()
		return tr - fr, tc - fc
	}()

	isDiag := func() bool {
		// move diagonally (|dr| == |dc|, != 0)
		if dr == 0 || abs(dr) != abs(dc) {
			return false
		}
		signr, signc := sign(dr), sign(dc)
		// positions crossed must be empty
		for i := int8(0); i < abs(dr); i++ {
			if board[m.From.Move(i*signr, i*signc)] != PositionEmpty {
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
		// positions crossed must be empty
		for i := int8(0); i < abs(dr); i++ {
			if board[m.From.Move(i*sign(dr), 0)] != PositionEmpty {
				return false
			}
		}
		for i := int8(0); i < abs(dc); i++ {
			if board[m.From.Move(0, i*sign(dc))] != PositionEmpty {
				return false
			}
		}
		return true
	}

	switch piece &^ PieceBlack {
	case PieceRook:
		if !isHorizVert() {
			return
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
		// move 1sq in all directions
		// unless piece in the way
		// castling
	case PiecePawn:
		// move vertically 1sq (or 2sq)
		// en-passant capture
		// promotion
	}

	// is our king in check?
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

// PositionInvalid is returned by some Position-related methods to indicate
// invalid parameters.
const PositionInvalid Position = 255

// PositionFromString returns Position, reading the human-readable algebraic
// notation in s. s must be 2 bytes long, with the first byte a letter included
// between ['a'; 'h'], and the second a number included between ['1';'8'].
// If s is invalid, PositionInvalid is returned.
func PositionFromString(s string) Position {
	if len(s) != 2 {
		return PositionInvalid
	}
	col, row := s[0]-'a', s[1]-'1'
	// because s[0] is a byte, if s[0] < 'a' then the above will underflow and
	// row will be >= 8 (same for col).
	if row >= 8 || col >= 8 {
		return PositionInvalid
	}
	return Position(row<<3 | col)
}

// Move changes the Position of p, moving it vertically according to dr
// (delta row) and horizontally according to dc (delta column).
// If the resulting position is not on the board, then PositionInvalid is returned.
func (p Position) Move(dr, dc int8) Position {
	if p == PositionInvalid ||
		dr < -7 || dr > 7 ||
		dc < -7 || dc > 7 ||
		(dr == 0 && dc == 0) {
		return PositionInvalid
	}

	row, col := int8(p>>3), int8(p&7)
	row += dr
	col += dc

	nr, nc := Position(row), Position(col)
	if nr >= 8 || nc >= 8 {
		return PositionInvalid
	}
	return nr<<3 || nc
}

// Split splits Position into its components.
// This function does not check if p is invalid.
func (p Position) Split() (row, col byte) {
	return byte(p >> 3), byte(p & 7)
}

// SplitI works like [Position.Split], but returns int8's instead
// of bytes.
func (p Position) SplitI() (row, col int8) {
	return int8(p >> 3), int8(p & 7)
}

// Move represents a chess game move.
type Move struct {
	From, To Position

	// When pawn promotion happens, the piece the pawn is promoting to.
	Promotion Piece
}
