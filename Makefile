.PHONY: default
default: help

GNOKEY ?= go run github.com/gnolang/gno/gno.land/cmd/gnokey
GNOLAND ?= go run github.com/gnolang/gno/gno.land/cmd/gnoland
GNOCMD ?= go run github.com/gnolang/gno/gnovm/cmd/gno
GNODEV ?= go run github.com/gnolang/gno/contribs/gnodev

GNOROOT ?= `$(GNOCMD) env GNOROOT`
GNO_TEST_FLAGS ?= -verbose
GNO_TEST_PKGS ?= gno.land/p/demo/chess/... gno.land/r/demo/chess

MNEMONIC_TEST1 ?= source bonus chronic canvas draft south burst lottery vacant surface solve popular case indicate oppose farm nothing bullet exhibit title speed wink action roast

.PHONY: help
help: ## Display this help message.
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make [\033[36m<target>\033[0m...]\n"} /^[[0-9a-zA-Z_\.-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

.PHONY: clean
clean: ## Remove temporary files.
	find . -name '*.gen.go' -exec rm -rf {} +
	rm -rf .test

.PHONY: test.prepare
test.prepare:
	rm -rf .test
	# Create fake GNOROOT with stdlibs, testing stdlibs, and p/ dependencies.
	# This is currently necessary as gno.mod's `replace` functionality is not linked with the VM.
	mkdir -p .test/gnovm/tests .test/examples/gno.land/p/demo .test/examples/gno.land/r/demo
	cp -r "$(GNOROOT)/gnovm/stdlibs" .test/gnovm/stdlibs
	cp -r "$(GNOROOT)/gnovm/tests/stdlibs" .test/gnovm/tests/stdlibs
	for i in gno.land/p/demo/ufmt gno.land/p/demo/avl gno.land/r/demo/users; do \
		cp -r "$(GNOROOT)/examples/$$i" ".test/examples/$$i";\
	done
	# Copy over gnochess code.
	cp -r "$(PWD)/package" ".test/examples/gno.land/p/demo/chess"
	cp -r "$(PWD)/realm" ".test/examples/gno.land/r/demo/chess"

.PHONY: test
test: test.prepare ## Test packages and realms using gno, excluding perft tests.
	cd .test/examples; GNOROOT="$(PWD)/.test" $(GNOCMD) test -run '^Test(?:[^P]|P[^e]|Pe[^r])' $(GNO_TEST_FLAGS) $(GNO_TEST_PKGS)

.PHONY: test.perft
test.perft: test.prepare ## Run perft tests.
	cd .test/examples; GNOROOT="$(PWD)/.test" $(GNOCMD) test -run 'TestPerft' $(GNO_TEST_FLAGS) gno.land/p/demo/chess

.PHONY: test.integration
test.integration: ## Test the realm using integration tests.
	go test -v ./util/integration

.PHONY: test.all
test.all: test test.perft test.integration ## Run all tests

.PHONY: run.faucet
run.faucet: ## Run the GnoChess faucet.
	cd faucet; go run main.go \
		-fund-limit 250000000ugnot \
		-send-amount 1000000000ugnot \
		-chain-id tendermint_test \
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
		-mnemonic "$(MNEMONIC_TEST1)" \
		-num-accounts 1

.PHONY: run.web
run.web: ## Run the web server.
	cd web; npm install
	( \
	  echo "VITE_GNO_WS_URL=ws://127.0.0.1:36657/websocket"; \
	  echo "VITE_GNO_CHESS_REALM=gno.land/r/demo/chess"; \
	  echo "VITE_FAUCET_URL=http://127.0.0.1:8545"; \
	  echo "VITE_GNO_JSONRPC_URL=http://127.0.0.1:36657"; \
	) > web/.env
	cp web/.env web/assets/js/.env
	cd web; npm run build
	cd web; npm run dev

.PHONY: run.gnodev
run.gnodev: ## Run gnodev with the gnochess packages and realm.
	$(GNODEV) ./package/glicko2 ./package/zobrist ./package ./realm

z_add_test1: ## Add the test1 key to gnokey.
	printf '\n\n%s\n\n' "$(MNEMONIC_TEST1)" | $(GNOKEY) add --recover --insecure-password-stdin test1 || true
	$(GNOKEY) list | grep test1

z_build_realm: ## Precompile and build the generated Go files. Assumes a working clone of gno in ../gno.
	mkdir -p ../gno/examples/gno.land/r/gnochess
	cp -rf realm/*.gno ../gno/examples/gno.land/r/gnochess
	$(GNOCMD) precompile --verbose ../gno/examples/gno.land
	$(GNOCMD) build --verbose ../gno/examples/gno.land/r/gnochess

z_poormans_dashboard:
	@( \
		go run github.com/gnolang/gno/gno.land/cmd/gnokey \
			query 'vm/qeval' \
		  -remote 'https://rpc.gnochess.com:443' \
		  -data "`printf "gno.land/r/demo/chess\nLeaderboard(\\"rapid\\")"`"; \
		go run github.com/gnolang/gno/gno.land/cmd/gnokey \
			query 'vm/qeval' \
		  -remote 'https://rpc.gnochess.com:443' \
		  -data "`printf "gno.land/r/demo/chess\nLeaderboard(\\"blitz\\")"`"; \
	) | \
	    grep data: | \
	    cut -d ' ' -f 2 | \
		sed s/^.// | \
	    jq -sr '.[]' | \
	    jq -r -s '.[][] | (.address + " " + ((.rapid.losses + .rapid.wins + .rapid.draws) | tostring) + " " + ((.blitz.losses + .blitz.wins + .blitz.draws) | tostring))' | \
		sort | uniq
