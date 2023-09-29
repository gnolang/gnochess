#!/bin/bash

while read -r addr; do
	printf "\"$addr\":"
	ht --ignore-stdin -b https://form.gnochess.com/.netlify/functions/query 'Authorization: mL#WJ*Zt82MM2nj5' 'Cookie: eb09bde7-610a-48c7-80ed-e0174f364d8f=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJoYXNoIjoiRW9ERUlITWxRY3V4NGhIUG10dFZOX05CTnd2UE85OXZZZHVrTGYyM1ZRND0iLCJzaXRlX2lkIjoiZWIwOWJkZTctNjEwYS00OGM3LTgwZWQtZTAxNzRmMzY0ZDhmIn0.0CcgUl6zSuVQX5oCb9_AiveSfnXTC7skVUiQT4G7jNw' "address=$addr" 2>&1 | tr -d '\n'
	echo ,
done < addresses.txt
