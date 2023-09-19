#!/bin/bash
# Auto-deploys realm on any change.

t1mnemonic="source bonus chronic canvas draft south burst lottery vacant surface solve popular case indicate oppose farm nothing bullet exhibit title speed wink action roast"
export SHELL="/bin/bash"

if [ ! -f ".deployer.touch" ]; then
	printf '\n\n%s\n\n' "$t1mnemonic" | gnokey add --recover --insecure-password-stdin test1
	touch .deployer.touch
fi

cd realm/

sleep 7.5 # get gno node set up

ls *.gno | entr -ns '
path=gno.land/r/demo/chess_$RANDOM
echo "publishing as $path"
echo | gnokey maketx addpkg \
	--gas-wanted 50000000 \
	--gas-fee 1ugnot \
	--pkgpath $path \
	--pkgdir . \
	--insecure-password-stdin \
	--remote gnoland:26657 \
	--broadcast test1'
