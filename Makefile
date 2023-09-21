0_setup_gnokey:
	printf '\n\n%s\n\n' "source bonus chronic canvas draft south burst lottery vacant surface solve popular case indicate oppose farm nothing bullet exhibit title speed wink action roast" | gnokey add --recover --insecure-password-stdin DeployKey || true
	gnokey list | grep DeployKey

1_run_gnoland:
	rm -rf .tmp/gnoland
	mkdir -p .tmp/gnoland
	cp -rf `go list -m -mod=mod -f '{{.Dir}}' github.com/gnolang/gno`/gno.land .tmp/gnoland/gno.land
	cp -rf `go list -m -mod=mod -f '{{.Dir}}' github.com/gnolang/gno`/examples .tmp/gnoland/examples
	chmod -R u+w .tmp/gnoland
	( \
	  echo g1plqds6kxnfaqcpky0gtt6fpntfhjgcfx8r73a0=100000000000000000ugnot # @Faucet account \
	  echo g1sgy2zhqg2wecuz3qt8th63d539afagjnhs4zj3=100000000000000000ugnot # @Faucet account \
	  echo g1unk9a8yt595p4yxpfpejewvf9lx6yrvd2ylgtm=100000000000000000ugnot # @Faucet account \
	  echo g17x4qwuhmc6fyp6ut2qtscc9265xe5jnj83s8c6=100000000000000000ugnot # @Faucet account \
	  echo g1agq8t3289xxmm63z55axykmmve2pz87yqgyn5n=100000000000000000ugnot # @Faucet account \
	  echo g153xesqpfvr5y35l0aykew3796kz452zttp0xt2=100000000000000000ugnot # @Faucet account \
	  echo g18epncd7avkhmdlf930e4t2p7c7j9qdv3yda93f=100000000000000000ugnot # @Faucet account \
	  echo g1elguymy8sjjy246u09qddtx587934k6uzf8mc4=100000000000000000ugnot # @Faucet account \
	  echo g1sl70rzvu49mp0lstxaptmvle8h2a8rx8pu56uk=100000000000000000ugnot # @Faucet account \
	  echo g18dgugclk93v65qtxxus82eg30af59fgk246nqy=100000000000000000ugnot # @Faucet account \
	) >> .tmp/gnoland/gno.land/genesis/genesis_balances.txt
	ln -s `go list -m -mod=mod -f '{{.Dir}}' github.com/gnolang/gno`/gnovm .tmp/gnoland/gnovm
	#mkdir -p .tmp/gnoland/gno.land/testdir/config
	#cp ./util/devnet/config.toml .tmp/gnoland/gno.land/testdir/config/config.toml
	cd .tmp/gnoland/gno.land; go run github.com/gnolang/gno/gno.land/cmd/gnoland start \
	  -genesis-max-vm-cycles 100000000

2_run_faucet:
	cd faucet; go run main.go \
		-fund-limit 250000000ugnot \
    -send-amount 1000000000ugnot \
    -tokens juhb8a7p1D \
    -tokens 6wrBVqzBgQ \
    -tokens Ko3z72NaQm \
    -tokens 6j7v0lDR39 \
    -tokens xqh4stG702 \
    -tokens lWGjlfP5rs \
    -tokens UG8f8igNO6 \
    -tokens b3JUurpCFb \
    -tokens 4azfjy6hE9 \
    -tokens dzNR5KAz2r \
    -tokens lZOO7O5OeE \
    -tokens epxa67WQ2c \
    -tokens GnfMj2sDCO \
    -tokens kDN7hiiSWE \
    -tokens OtLfdJC279 \
    -tokens GNZi9TlXBu \
    -tokens 6sVZv0ww7v \
    -tokens SdmrRLKXcx \
    -tokens 8GfDC6ODwr \
    -tokens 783xSVRGbI \
    -mnemonic "piano aim fashion palace key scrap write garage avocado royal lounge lumber remove frozen sketch maze tree model half team cook burden pattern choice" \
    -num-accounts 10

3_run_web:
	cd web; npm install
	( \
	  echo "VITE_GNO_WS_URL=ws://127.0.0.1:26657/websocket"; \
	  echo "VITE_GNO_CHESS_REALM=gno.land/r/demo/chess"; \
	  echo "VITE_FAUCET_URL=http://127.0.0.1:8545"; \
	) > web/.env
	cp web/.env web/assets/js/.env
	cd web; npm run build
	cd web; npm run dev

4_deploy_realm:
	echo | gnokey maketx addpkg --insecure-password-stdin --gas-wanted 20000000 --gas-fee 1ugnot --pkgpath gno.land/r/demo/chess --pkgdir ./realm --broadcast DeployKey
