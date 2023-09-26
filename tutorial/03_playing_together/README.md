# Playing together

We have seen how we can use realm to write smart contracts; we've seen how to
create a chess engine to validate our rules. It's now time to combine the power
of the two together to allow us to play online!

Since the last tutorial, a fellow colleague joined you on this "web3
chess server" enterprise you started. He's been very helpful: as a matter of
fact, he got very interested, so this weekend he's worked out quite a bunch of
things for you: how to go from rules.gno to being able to create new games (see
`NewGame` in `chess.gno`), he added a full engine to understand endgame
conditions (do you have the slightest idea what [Zobrist Hashing](https://www.chessprogramming.org/Zobrist_Hashing)
is? Turns out we got around 800 very big uint64's in `hash.gno`
just to compute a chessboard hash), and he's also went as far as writing tests
for things like: resignations, draws, etc.

Test driven development is not that bad is it? Especially when the tests are
already written for you!

In this tutorial we're going to extend the functionality of our chess realm to
be able to draw and resign a chess game.

## Exploring the new functions

- Invite the user to try to deploy a realm
- Some sample commands to create two accounts (possibly with another address
  which in genesis block? may have to modify patch/gnochess genesis block file)
  and have them play out a Scholar's Mate (black would be checkmated).

Now, black would have really liked to be able to resign when they realised white
was yet again to use the scholar's mate against them. Let's add that
functionality, shall we?

## Adding resign and draw

- Point to chess_test.gno  tests with TODO comments
- Point to how the current strucutre of the endpoints has JSON with manually
  written marshalers: one of the many advantages of using software so early in
  development!
- Point to the Game struct, to how one might go about creating the two functions
  (as well as DrawOffer), correlating with the `Position.IsFinished` engine
  added, and adding solutions in relation to the source in `realm/chess.gno`
- Test it out with Gnokey

## Thank you!

- Add links to the realm to find out more about the realm
- Specify that we may update this in the future to add future tutorials
- Mention that users can sign up at the booth to participate in the raffle
- add Extra section with CTA's to get involved in the project.
