# Creating a move validator

In order to write a chess server, we'll need to do the backend probably one of
the most important things in order to make sure that the games played on our
server are fair, and no hacker cheating the frontend can try to make arbitrary
moves on the backend.

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

Due to the complexity of the task at hand, we won't be building a fully-fledged
move validator/generator. We will be playing around a bit, however!

[^1]: There's some nuance to this, as it's not often phrased this way elsewhere.
  Though most chess engines do involve some two-step process which involves _try
  doing a move (allowed by the moveset), and then make sure the player is not in
  check_.
