#!/bin/bash
set -eu

rm -rf "$GNOROOT/gno.land"
mkdir -p "$GNOROOT"
cd "$GNOROOT"

echo "copying stdlibs and examples from source..."
mkdir -p "$GNOROOT/gnovm"
rsync -a /opt/gno/src/gnovm/stdlibs "$GNOROOT/gnovm/"
rsync -a --delete /opt/gno/src/examples  "$GNOROOT/"

for gm in $(find /mnt -name 'gno.mod'); do
	pkgpath="$(sed -n 's/^module \(.*\)$/\1/gp' "$gm")"
	echo "adding module $pkgpath..."
	mkdir -p "$GNOROOT/examples/$pkgpath"
	# more conservative flags to avoid issues with entr.
	rsync -a --delete --inplace "$(dirname "$gm")/" "$GNOROOT/examples/$pkgpath"
done

mkdir -p gno.land/testdir/config gno.land/genesis
cp /opt/gno/src/gno.land/testdir/config/config.toml gno.land/testdir/config/
rsync -ap /opt/gno/src/gno.land/genesis/ gno.land/genesis/
echo "starting gnoland"
cd gno.land
gnoland start -genesis-max-vm-cycles 100''000''000
