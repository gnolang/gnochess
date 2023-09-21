1_run_gnoland:
	rm -rf .tmp/gnoland
	mkdir -p .tmp/gnoland
	cp -rf `go list -m -mod=mod -f '{{.Dir}}' github.com/gnolang/gno`/gno.land .tmp/gnoland/gno.land
	cp -rf `go list -m -mod=mod -f '{{.Dir}}' github.com/gnolang/gno`/examples .tmp/gnoland/examples
	ln -s `go list -m -mod=mod -f '{{.Dir}}' github.com/gnolang/gno`/gnovm .tmp/gnoland/gnovm
	chmod -R u+w .tmp/gnoland
	#mkdir -p .tmp/gnoland/gno.land/testdir/config
	#cp ./util/devnet/config.toml .tmp/gnoland/gno.land/testdir/config/config.toml
	cd .tmp/gnoland/gno.land; go run github.com/gnolang/gno/gno.land/cmd/gnoland start \
	  -genesis-max-vm-cycles 100000000
