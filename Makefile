default: help

GNOKEY ?= go run github.com/gnolang/gno/gno.land/cmd/gnokey
GOLAND ?= go run github.com/gnolang/gno/gno.land/cmd/gnoland

help: ## Display this help message.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[0-9a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

0_setup_gnokey: ## Add an account that will be used for Realm deployment (to gnokey).
	printf '\n\n%s\n\n' "source bonus chronic canvas draft south burst lottery vacant surface solve popular case indicate oppose farm nothing bullet exhibit title speed wink action roast" | $(GNOKEY) add --recover --insecure-password-stdin DeployKey || true
	$(GNOKEY) list | grep DeployKey

1_run_gnoland: ## Run the gnoland node.
	go mod download -x
	rm -rf .tmp/gnoland
	mkdir -p .tmp/gnoland
	cp -rf `go list -m -mod=mod -f '{{.Dir}}' github.com/gnolang/gno`/gno.land .tmp/gnoland/gno.land
	cp -rf `go list -m -mod=mod -f '{{.Dir}}' github.com/gnolang/gno`/examples .tmp/gnoland/examples
	chmod -R u+w .tmp/gnoland
	( \
	  echo g1plqds6kxnfaqcpky0gtt6fpntfhjgcfx8r73a0=100000000000000000ugnot; \
	  echo g1sgy2zhqg2wecuz3qt8th63d539afagjnhs4zj3=100000000000000000ugnot; \
	  echo g1unk9a8yt595p4yxpfpejewvf9lx6yrvd2ylgtm=100000000000000000ugnot; \
	  echo g17x4qwuhmc6fyp6ut2qtscc9265xe5jnj83s8c6=100000000000000000ugnot; \
	  echo g1agq8t3289xxmm63z55axykmmve2pz87yqgyn5n=100000000000000000ugnot; \
	  echo g153xesqpfvr5y35l0aykew3796kz452zttp0xt2=100000000000000000ugnot; \
	  echo g18epncd7avkhmdlf930e4t2p7c7j9qdv3yda93f=100000000000000000ugnot; \
	  echo g1elguymy8sjjy246u09qddtx587934k6uzf8mc4=100000000000000000ugnot; \
	  echo g1sl70rzvu49mp0lstxaptmvle8h2a8rx8pu56uk=100000000000000000ugnot; \
	  echo g18dgugclk93v65qtxxus82eg30af59fgk246nqy=100000000000000000ugnot; \
	) >> .tmp/gnoland/gno.land/genesis/genesis_balances.txt
	ln -s `go list -m -mod=mod -f '{{.Dir}}' github.com/gnolang/gno`/gnovm .tmp/gnoland/gnovm
	#mkdir -p .tmp/gnoland/gno.land/testdir/config
	#cp ./util/devnet/config.toml .tmp/gnoland/gno.land/testdir/config/config.toml
	cd .tmp/gnoland/gno.land; $(GNOLAND) start \
	  -genesis-max-vm-cycles 100000000

2_run_faucet: ## Run the GnoChess faucet.
	cd faucet; go run main.go \
		-fund-limit 250000000ugnot \
    -send-amount 1000000000ugnot \
    -tokens juhb8a7p1D -tokens 6wrBVqzBgQ -tokens Ko3z72NaQm -tokens 6j7v0lDR39 -tokens xqh4stG702 \
    -tokens lWGjlfP5rs -tokens UG8f8igNO6 -tokens b3JUurpCFb -tokens 4azfjy6hE9 -tokens dzNR5KAz2r \
    -tokens lZOO7O5OeE -tokens epxa67WQ2c -tokens GnfMj2sDCO -tokens kDN7hiiSWE -tokens OtLfdJC279 \
    -tokens GNZi9TlXBu -tokens 6sVZv0ww7v -tokens SdmrRLKXcx -tokens 8GfDC6ODwr -tokens 783xSVRGbI \
    -tokens Ahphohei4b -tokens uPulohsh4f -tokens aigeVah1El -tokens wuchi4feeP -tokens Ae9weim0OK \
    -tokens ieb2Leik7e -tokens pohJ9oozoo -tokens xoKaesh3ae -tokens di6eeYooco -tokens bahti5ek0L \
    -tokens Uu5quoh6Oo -tokens Phaix9Ahcu -tokens maiGh8ziew -tokens ohPhoo9aev -tokens aeveV5ohgh \
    -tokens ceJ1reexoa -tokens rash0Ku5ha -tokens shaequoh7P -tokens NiLiesah3u -tokens Pion1Phie9 \
    -tokens ahkiev9Foo -tokens uaXiJ7eine -tokens thoTej9yo9 -tokens eiTee2Eizu -tokens ier6oaQu5p \
    -tokens fahoSoa5ee -tokens boet9fo2Ek -tokens ugh9Iedai7 -tokens no7ohsaiXo -tokens ahViquie5Z \
    -tokens Iquae8oozo -tokens Esh5on7eiT -tokens Moop1eekoo -tokens gae6uo5Sae -tokens fei9aufeeX \
    -tokens chee6aC9ph -tokens zongo0Coe3 -tokens Leing1pi0a -tokens ekai5Aih8N -tokens Kasu3es5ch \
    -tokens eeChe1OhKu -tokens Al9Oojoo3I -tokens Xohwate0AT -tokens eef1ieJu1m -tokens eeGh4rohfi \
    -tokens cah3Shohye -tokens eiZ7eish3t -tokens aiF9LieTie -tokens she6eeceeP -tokens teev5Moh6t \
    -tokens Zae2ailitu -tokens seech3Eice -tokens iju8Aegeeh -tokens quooth6iZa -tokens Fae3ohng1o \
    -tokens Caibal9ahx -tokens iaPhoow2ha -tokens Iethee8Wu0 -tokens ahsahgh3Do -tokens Aithai7ahz \
    -tokens wocie7pe8O -tokens PhaelahN0B -tokens boon4Yohth -tokens ohke9Pha0o -tokens UYieShez6a \
    -tokens aR8zaeWee0 -tokens ka0aeVai6z -tokens Oi6oThaez1 -tokens oodee5INga -tokens Aet6WeePu8 \
    -tokens Fieroo3Xai -tokens Is4neath2N -tokens EeliegeiT8 -tokens Ahg9aishi8 -tokens aj4mah9Daa \
    -tokens Sheish0foo -tokens ooseethoM8 -tokens Xaiphai8no -tokens ni9eeLei9f -tokens ieveiwai3E \
    -tokens mooQuag4ee -tokens ZaeRieph2j -tokens AeY8iPioh4 -tokens Huar8iemee -tokens shoo5Loh8z \
    -tokens ohz8Reetev -tokens Eotahh4aja -tokens Xae9ciew9B -tokens aeVe1Oethe -tokens eihah2Ahw7 \
    -tokens Chai8laile -tokens ku9iax9Cho -tokens Ahl4veihud -tokens FaShutaj2v -tokens nahS6iu0Yi \
    -tokens Ohzaj5wi2m -tokens EeL0Agee0e -tokens eePhie7tho -tokens Eisai2ew6E -tokens woiyoo6Xee \
    -mnemonic "piano aim fashion palace key scrap write garage avocado royal lounge lumber remove frozen sketch maze tree model half team cook burden pattern choice" \
    -num-accounts 10

3_run_web: ## Run the web server.
	cd web; npm install
	( \
	  echo "VITE_GNO_WS_URL=ws://127.0.0.1:26657/websocket"; \
	  echo "VITE_GNO_CHESS_REALM=gno.land/r/demo/chess"; \
	  echo "VITE_FAUCET_URL=http://127.0.0.1:8545"; \
	  echo "VITE_GNO_JSONRPC_URL=http://127.0.0.1:26657"; \
	) > web/.env
	cp web/.env web/assets/js/.env
	cd web; npm run build
	cd web; npm run dev

4_deploy_realm: ## Deploy GnoChess realm on local node.
	echo | $(GNOKEY) maketx addpkg \
	  --insecure-password-stdin \
	  --gas-wanted 20000000 \
	  --gas-fee 1ugnot \
	  --pkgpath gno.land/r/demo/chess \
	  --pkgdir ./realm \
	  --broadcast \
	  DeployKey

z_use_local_gno: ## Use the local '../gno' directory instead of the remote 'github.com/gnolang/gno' module.
	@echo "Switching to local gno module..."
	@go mod edit -replace github.com/gnolang/gno=../gno

z_use_remote_gno: ## Use the remote 'github.com/gnolang/gno' module and remove any replacements.
	@echo "Switching to remote gno module..."
	@go mod edit -dropreplace github.com/gnolang/gno

z_test_realm: ## Test the realm.
	go run github.com/gnolang/gno/gnovm/cmd/gno test --verbose ./realm

z_build_realm: ## Precompile and build the generated Go files. Assumes a working clone of gno in ../gno.
	mkdir -p ../gno/examples/gno.land/r/gnochess
	cp -rf realm/*.gno ../gno/examples/gno.land/r/gnochess
	go run github.com/gnolang/gno/gnovm/cmd/gno precompile --verbose ../gno/examples/gno.land
	go run github.com/gnolang/gno/gnovm/cmd/gno build --verbose ../gno/examples/gno.land/r/gnochess
