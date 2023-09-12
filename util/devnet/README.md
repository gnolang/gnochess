# devnet dockerfiles

Quickly set up a Gnochess devnet & hack interactively!

Instructions:

1. Install [`docker`](https://docs.docker.com/engine/install/) and [`docker compose`](https://docs.docker.com/compose/install/)
2. `cd` into this directory from your terminal
3. `docker compose` (or `docker compose -d`, if you want this to run in the
   background)
4. Gnoweb should now be accessible from http://localhost:8888
5. Set up the [test1 key](https://docs.onbloc.xyz/tutorials/start-writing-a-realm#deploying-locally) if you haven't already.
6. Use it to call the realm (visit `localhost:8888/r/demo/chess_XXXX`, XXXX is a
   random number, you can check out what was generated for you by calling `docker compose logs deployer | grep 'publishing as'`).
   If you visit the help page, gnoweb will generate some commands for you to
   call the realm.

Need more help? Check out a [small video tutorial](https://www.youtube.com/watch?v=-1huuUG2yRc).

If you're doing local development in the `realm` subdirectory, changes will
synchronise automatically and the realm will be auto-published, however it will
be at a new address. This is published in the `deployer` logs (see above
command).
