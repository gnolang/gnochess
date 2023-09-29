#!/bin/sh
(
		go run github.com/gnolang/gno/gno.land/cmd/gnokey \
				query 'vm/qeval' \
		  -remote 'https://rpc.gnochess.com:443' \
		  -data "`printf "gno.land/r/demo/chess\nLeaderboard(\\"rapid\\")"`";
		go run github.com/gnolang/gno/gno.land/cmd/gnokey \
				query 'vm/qeval' \
		  -remote 'https://rpc.gnochess.com:443' \
		  -data "`printf "gno.land/r/demo/chess\nLeaderboard(\\"blitz\\")"`";
) | \
	grep data: | \
	cut -d ' ' -f 2 | \
		sed s/^.// | \
	jq -sr '.[]' | \
	jq -r -s '.[][] | .address' | \
		sort | uniq | tee addresses.txt
