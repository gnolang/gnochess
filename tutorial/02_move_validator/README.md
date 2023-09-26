# Creating a move validator

In order to write a chess server, we'll need to do the backend probably one of
the most important things in order to make sure that the games played on our
server are fair, and no hacker cheating the frontend can try to make arbitrary
moves on the backend: validating moves.

Of course, though, creating a move validator is slightly harder than you may
think at first glance. Not only do we need to check that each piece is moving
accordng to its moveset (and check along the way that we're not capturing one of
our own pieces, that the piece is not crossing on anything else unless it's a
knight...), we also need to implement the rules for determining whether a king
is in **check.**

<details>
<summary>Chess rule recap if you need it!</summary>

There are 6 "classes" of pieces in chess, which move in the following ways:

* The **pawn** moves **1 square** in the direction of the opponent's side of the
  board.
  * The pawn is unable to capture in the same direction it moves, unlike all
	other pieces: instead, it can only capture moving 1 square diagonally, in
	the direction of the opponent's side.
  * When the pawn is in its starting position, ie. the 2nd rank (aka row)
    for white and the 7th rank for black, it has the possibility to move
	**2 squares forward.**
  * When the pawn reaches the very edge of the board on the opponent's side, it
	must **promote**, which is to say the pawn must be exchanged for a rook,
	bishop, knight or queen. (In most circumstances, players pick the queen.)
  * When an opponent pawn of an adjacent file (aka column) moves
  	**2 squares forward from its starting position,** a pawn on the 5th rank
	(aka row) is capable of capturing it as if it had only moved 1 square
	forward. <!-- TODO: Add small gif to explain. --> \
	This is **only possible on the move following the opponent moving a piece
	2 squares forward.**
* The rook moves vertically and horizontally in any direction, by any possible
  amount of squares.
* The bishop moves diagonally in any direction, by any possible amount of
  squares.
* The knight moves in "L-shape" moves. This means 1 square in one direction, and
  2 squares in a perpendicular direction, and vice versa. <!-- TODO: small gif -->
* The queen is a rook and bishop combined -- in other words, it moves
  horizontally, vertically and diagonally in any direction by any number of
  squares.
* The king moves 1 square in all directions (including diagonals).
  * The king can also **castle.** Castling is done by moving a king and a rook
	at the same time. The king and the rook (of the same colour) must be in
	their starting position, and not have moved since the beginning of the game.
	Provided that the squares between the two pieces are empty, AND that the
	king is not in check nor any of the squares it crosses are in check, the king
	may move 2 squares in the direction of the rook, and consequently the rook
	must be placed adjacent to the king on the other side. <!-- TODO: small gif -->

Additionally, there are some very important general rules:

* No piece can capture a piece of the same color.
* Except for the knight, no piece may "cross" other pieces when moving.

Finally, a player's king is considered in **check** when another piece threatens to
capture it on the following move. If a player's king is in check, the player
is **forced** to move it out of checked (either by moving it, or capturing the
opponent's threat, or "blocking" the line of attack -- whichever's possible).
If the king is in check and cannot be moved out of check, the game is concluded
in **checkmate**.

</details>

Determining whether a king is in check is not an easy feat as it requires us to
use a _move generator_ to understand whether the king is effectively under
attack.

Effectively, creating a _move generator_ together with a _validator_ means that
we've effectively created the basis for a chess engine (like Stockfish and
AlphaZero, for instance). What a chess engine additionally entails is the
capacity of **searching** (looking through a part of the entire move tree, up to
a certain depth, to find better and better moves) and **evaluating** (once a
given depth is reached, and the game outcome is not obvious, use an algorithm to
determine without further recursive inspection if the position is winning).[^1]

[^1]: There's some nuance to this, as it's not often phrased this way elsewhere.
  Though most chess engines do involve some two-step process which involves _try
  doing a move (allowed by the moveset), and then make sure the player is not in
  check_.

Due to the complexity of the task at hand, we won't be building a full move
validator from scratch. Since the author of this tutorial has already undertaken
the task of doing, we will let you simply fill in the fun parts...

## A fill in the blanks move generator

Open up `rules.gno` -- you should see the rough structure of a move generator
that we've implemented for this workshop. In fact, it is a trimmed down version
of the one we're using for [the full GnoChess dApp](../../r/chess/rules.gno), but
let's not get ahead of ourselves.

By scrolling down to the `Position.validateMove` method, you should be able to
see a bunch of `// TODO` comments. This is where you'll come in to fill in the
gaps and help to write the move generator!

Together with it, as we just mentioned, we'll need a _move generator_. The one
here is simple, but it should help catch any bugs: scroll down to inspect
`Position.GenMoves`. This method simply iterates over the board and tries every
single combination piece-square, where the other square is not occupied by a
piece of the same colour. Note that this is called by the `InCheck` method above.

Just for a recap, here's some context about the data structures we'll be using,
and some of the decisions that have been made:

- The `Position` type exists because the possible moves from each position are
  not just a function of the chessboard -- even in a real-life chess game, we
  need the players to keep track of:
  - whether the rooks or king have moved (if they have, castling may not be
    possible on the side of the rook, or in the case of the king, for that player in general).
  - Additionally, to handle en passant captures correctly, we can speed-up some
    processing by saving the en passant column in the flags.
  - Finally, we need to know whose turn it is to play! We can easily deduce that
    just by looking at `len(p.Moves)` -- if it's even, then it's white to play,
	if it's odd, then it's black to play. (There is the helper `Color()` method
	to get that!)
- We encode the `Board` as an array of 64 `Piece`s. A `Piece` is just an enum
  containing the piece class, with an additional flag to "mark" the piece as
  black.
  - Note: this is how we're representing boards here, but chess programming in
	general gets [much more creative](https://www.chessprogramming.org/Bitboards).
	Talking about chess engine optmisations would deserve its own workshop, so
	we're going to keep things simple here!
- To encode each square in the chessboard, we have the helper `Square` type,
  which can help us convert back and forth from algebraic coordinates (eg. `g4`).

With that said, we're ready to implement our move validator. Try filling out the
blanks!

Note that the function is structured so that every time you detect that a move
is incorrect, you can simply `return` with no arguments (due to named return
parameters). If validation gets out of the switch block, it is assumed to have
succeeded, and the actual board "mutation" will be performed at the end of the
function.

<details>
<summary>Some hints!</summary>

- Note we have `dr` and `dc` as variables declared, just a few lines above the
  switch. These are your best friends: they stand for `delta rows` and
  `delta columns`; in other words, they express precisely the "movement" we wish
  to verify!
- There's also two mathematical primitives that can come useful for
  verification, `abs` and `sign`. An example where these may be useful is in the
  bishop move: you can simply check diagonal moves by checking
  `abs(dr) == abs(dc)`! (Note: we don't need if either of them is zero, as we
  already make sure that some movement has actually occurred at the top of
  `validateMove` -- so one of them has to be `!= 0`)
- The `Delta` type may also be useful to you. It doesn't do much, but it has
  some useful linear algebra-inspired helper functions, that can help you check
  for various movements easily. For instance, you can repeatedly use `Delta.Rot()`
  on the vectors `Delta{2, 1}` and `Delta{1, 2}` to check for knight moves...

</details>

## Let's test!

For testing, we'll be relying on the tried-and-tested
[Perft tests](https://www.chessprogramming.org/Perft_Results) to benchmark our
engine against existing engines. The idea is simple: count the number of moves
our engine finds at a given depth. (For instance, at depth 1, there will be 20
moves: `8*2` moves for the pawns, and 2 each for the knights).

As usual, the command for executing the tests is `gno test .`.

We've already implemented the testing function using the data structures we
talked about. If we run it at the beginning, we'll see it says that we have zero
possible moves at all times. The reason is simple: because we haven't yet
implemented any move validation, a piece can move anywhere, which includes where
the king is on the other side of the board. Thus `InCheck` always returns true!

_Note: it is not important that you get to have perfectly matching `perft` tests
right away! Writing a move validator is not trivial, and may take a bit of time.
Don't worry if you haven't finished doing it by the end of this tutorial
section!_

Running perft tests may be a bit slow. You have two strategies:

* You can either comment out some of the numbers to try to search only up to a
  given depth.
* You can do a simple rename of the `*.gno` files to `*.go` temporarily. Gno is
  very premature at the time of writing, so code will naturally perform better
  with Go -- and for cases like these ones, where our code doesn't depend
  essentially on any other package, the same code (and tests!) will be valid in
  both languages.

Finally, there is one small aid if you want to dig deep into debugging `perft`
tests: you can set the `perftDebug` flag to true in `rules_test.gno`. This
allows you to compare what's printed to the console with the output you get if
you try to run the following commands from [Stockfish](https://stockfishchess.org/),
on the commandline:

```
position fen r3k2r/Pppp1ppp/1b3nbN/nPP5/BB2P3/q4N2/P2P2PP/q2Q1RK1 w kq - 0 2
go perft 2
```

This searches at the position with the given FEN at depth two. It will print all
the legal moves for that position, and the number of sub-moves they have!

<details>
<summary>Sample solution</summary>

```go
// validateMove allows for m to be a "king-capture" move, which is illegal in
// chess, but it is useful for InCheck.
func (oldp Position) validateMove(m Move) (_ Position, ok bool) {
	p := oldp.clone()

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

	isDiag := func() bool {
		// move diagonally (|dr| == |dc|)
		if abs(dr) != abs(dc) {
			return false
		}
		signr, signc := sign(dr), sign(dc)
		// squares crossed must be empty
		for i := int8(1); i < abs(dr); i++ {
			if p.B[m.From.Move(i*signr, i*signc)] != PieceEmpty {
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
			if p.B[m.From.Move(i*sign(dr), 0)] != PieceEmpty {
				return false
			}
		}
		for i := int8(1); i < abs(dc); i++ {
			if p.B[m.From.Move(0, i*sign(dc))] != PieceEmpty {
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
		case fg: // a-col rook (either side)
			if color == White {
				newFlags |= NoCastleWQ
			} else {
				newFlags |= NoCastleBQ
			}
		case fg | 7: // h-col rook (either side)
			if color == White {
				newFlags |= NoCastleWK
			} else {
				newFlags |= NoCastleBK
			}
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
				p.castlingDisabled(color, ctype) ||
				// check that we have the exact board set ups we need
				// + make sure that the original and crossed squares are not in check
				!p.checkCastlingSetup(ctype) {
				return
			}

			// perform rook move here
			p.B = p.B.castleRookMove(color, ctype)
			// add NoCastle flags to prevent any further castling
			if color == White {
				newFlags |= NoCastleWQ | NoCastleWK
			} else {
				newFlags |= NoCastleBQ | NoCastleBK
			}
			break
		}
		// move 1sq in all directions
		if dc < -1 || dc > 1 || dr < -1 || dr > 1 {
			return
		}
		// king has moved: disable castling.
		if color == White {
			newFlags |= NoCastleWQ | NoCastleWK
		} else {
			newFlags |= NoCastleBQ | NoCastleBK
		}

	case PiecePawn:
		// determine direction depending on color
		dir := int8(1)
		if color == Black {
			dir = -1
		}

		switch {
		case dc == 0 && dr == dir: // 1sq up
			// destination must be empty (no captures allowed)
			if p.B[m.To] != PieceEmpty {
				return
			}
		case dc == 0 && dr == dir*2: // 2sq up (only from starting row)
			wantRow := Square(1)
			if color == Black {
				wantRow = 6
			}
			// check starting row, and that two squares are empty
			if (m.From>>3) != wantRow ||
				p.B[m.From.Move(int8(dir), 0)] != PieceEmpty ||
				p.B[m.To] != PieceEmpty {
				return
			}
			_, col := m.To.Split()
			newFlags |= EnPassant | PositionFlags(col)
		case abs(dc) == 1 && dr == dir: // capture on diag
			// must be a capture
			if p.B[m.To] == PieceEmpty {
				if sq := p.checkEnPassant(color, m.To); sq != SquareInvalid {
					// remove other pawn
					p.B[sq] = PieceEmpty
					break
				}
				return
			}
			// p.B[m.To] is necessarily an opponent piece; we check & return
			// p.B[m.To].Color == color at the beginning of the fn.
		default: // not a recognized move
			return
		}

		row := m.To >> 3
		if (color == White && row == 7) ||
			(color == Black && row == 0) {
			switch m.Promotion {
			case 0:
				// m.To is a king? then this is a pseudo-move check.
				// assume queen in that case.
				if p.B[m.To].StripColor() != PieceKing {
					// no promotion given, invalid
					return
				}
				m.Promotion = PieceQueen
			case PieceQueen, PieceBishop, PieceKnight, PieceRook:
			default:
				return
			}
			promoted = true
			p.B[m.From] = m.Promotion | color.Piece()
		}
	}

	// reject moves with promotion if there's nothing to promote
	if m.Promotion != 0 && !promoted {
		return
	}

	if p.B[m.To].StripColor() == PieceKing {
		// King captures don't check for our own king in check;
		// these are only "theoretical" moves.
		return Position{}, true
	}

	// perform board mutation
	p.B[m.From], p.B[m.To] = PieceEmpty, p.B[m.From]
	p.Flags = newFlags
	p.Moves = append([]Move{}, p.Moves...)
	p.Moves = append(p.Moves, m)

	// is our king in check, as a result of the current move?
	if p.B.InCheck(color) {
		return
	}
	return p, true
}
```

```console
$ gno test -verbose .
=== RUN   TestPerft
=== RUN   TestPerft/n0
=== RUN   TestPerft/n1
=== RUN   TestPerft/n2
=== RUN   TestPerft/n3
=== RUN   TestPerft/n4
=== RUN   TestPerft/n5
=== RUN   TestPerft/n6
--- PASS: TestPerft (410.31s)
output: counts: [20 400 8902]

counts: [48 2039 97862]

counts: [14 191 2812 43238]

counts: [6 264 9467]

counts: [6 264 9467]

counts: [44 1486 62379]

counts: [46 2079]
ok      ./.     411.37s
```

</details>


## Extra: further improvements

One of the reasons why our perft tests are so slow are because our move
generator is terrible. With some improvements, we can make it be much more
efficient about which moves it effectively validates!

We can, for instance, re-implement some of the moves, without doing the full
validation (as that will be the job for ValidateMove). So, we can detect the
class of piece we're working with, and, for instance, if the piece is a rook,
only try passing horiz/vertical moves to `cb`. If the piece is a king, then we
can make it move once in all directions -- but remember: we must also try to
move it two squares left or right, to handle castling. Give it a shot!

<details>
<summary>Sample solution</summary>

The following is the implementation for the "official" realm:

```go
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
```

</details>
