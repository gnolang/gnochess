<h1>
	GnoChess
	<a href="https://gitpod.io/new/#https://github.com/gnolang/gnochess">
	<img alt="Open in Gitpod" src="https://gitpod.io/button/open-in-gitpod.svg">
	</a>
</h1>

GnoChess is an implementation of an online chess server with Gno. It is used to
showcase Gno's capabilities for developing semi-complex dApps. It comes with a
frontend and a faucet for ease of participation, and the backend and frontend
implement many features commonly found in chess servers (full ruleset
implementation, leaderboards, time controls, Glicko2 ratings).

This repository hosts both the source code for the [GnoChess realm and
website](https://gnochess.com), as well as a dedicted tutorial section,
originally planned to accompany a talk for Gophercon 2023.

## Getting Started

Running GnoChess has a few requirements:

- Go 1.21+
- Node 16+
- make
- git
- A POSIX environment (ie. have a UNIX shell, so Linux or macOS.
  WSL probably works but nobody tested it.)

After cloning the repository, run `go get` to install the dependencies, then you
can get started by running the following:

```sh
make run.web & make run.faucet & make run.gnodev
```

You can also call the three commands separately to have their individual
outputs; here is an example with tmux:

![637248](https://github.com/gnolang/gnochess/assets/4681308/03433d02-85e3-40a5-bf3b-ba46efc5c65c)

With that done, you will be able to access a (hopefully) working local set-up of
GnoChess on <http://localhost:1313>. At the time of writing, this still requires
access through a token: you can pick one of the ones available in the
[Makefile](Makefile) at the `run.faucet` section. (Annoying -- it will improve,
we're working on it!)

There's a rudimentary set up for working with docker also available on our
[docker-compose file](docker-compose.yml), though for the time being the local
set up using make is recommended!

## Workshop tutorial

> A Workshop on Gnochess has been held at Gophercon San Diego on 26/09/2023.
> Follow along on the [video](https://www.youtube.com/watch?v=JQh7LhqW7ns)
> or on the [slides](https://gnolang.github.io/workshops/presentations/2023-09-26--chess-the-gnolang-way--morgan/slides.html)

You can learn how to make a Gno chess server yourself by following the guides
in the `tutorial` section (at the time of writing, still being developed!).
The tutorials are designed to be performed in a GitPod workspace. By clicking
the above button, you can access GitPod and start hacking straight away!

After you've done that, click here to jump to the
[first tutorial](./tutorial/01_getting_started/README.md).
