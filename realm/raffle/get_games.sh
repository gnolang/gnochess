#!/bin/bash
gnokey query vm/qeval --data 'gno.land/r/demo/chess'$'\n''ListGames("limit:20000")' --remote https://rpc.gnochess.com:443 | grep data | sed -s 's/.*data: (\(".*"\) string)/\1/g' | jq -r . | tee games.json
