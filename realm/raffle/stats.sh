#!/bin/bash

while read -r addr; do
	jq -r '[.[] | select(.white == "'$addr'" or .black == "'$addr'")] | {games: length, won: [.[] | select(.[.winner] == "'$addr'")] | length, moves: [.[] | .position.moves | length] | add } | "{Address:\"'$addr'\", Games: \(.games), Won: \(.won), Moves: \(.moves)},"' games.json
done < addresses.txt
