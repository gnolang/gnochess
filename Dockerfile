FROM ghcr.io/gnolang/gno:latest

COPY ./util/node-config.toml ./gno.land/testdir/config/config.toml
COPY ./package ./examples/gno.land/p/demo/chess
COPY ./realm   ./examples/gno.land/r/demo/chess
