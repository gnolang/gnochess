1_run_gnoland:
	rm -rf .tmp/gnoland
	mkdir -p .tmp/gnoland/gno.land/testdir/config
	ln -s `go list -m -mod=mod -f '{{.Dir}}' github.com/gnolang/gno`/gno.land/genesis .tmp/gnoland/gno.land/genesis
	cp ./util/devnet/config.toml .tmp/gnoland/gno.land/testdir/config/config.toml
	ln -s `go list -m -mod=mod -f '{{.Dir}}' github.com/gnolang/gno`/examples .tmp/gnoland/examples
	cd .tmp/gnoland/gno.land; go run github.com/gnolang/gno/gno.land/cmd/gnoland start \
	  -genesis-max-vm-cycles 100000000 \
	  -skip-failing-genesis-txs
