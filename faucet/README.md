## Overview

### Requirements

- run faucet behind load balancer / rate limiter

### Middlewares

Present middlewares for parsing fund requests:

- user has `< X ugnot` on his account
- user has supplied a good request token in the form of a request header value (for key `faucet-token`)

### Getting Started

You can launch this faucet using:

- flags (see `--help` output)
- config file (values must match flag names, using `--config` flag)
- ENV vars (prefix is `GNOCHESS_FAUCET_`, followed by the flag name)

```bash
go build -o faucet
```

Example faucet run:

```bash
./faucet -listen-address 0.0.0.0:0 -fund-limit 10ugnot -mnemonic "..." -num-accounts 5 -remote http://127.0.0.1:26657 -send-amount 100ugnot -tokens alexis -tokens morgan -tokens albert
```

(replace the mnemonic with a valid bip39 mnemonic)

## Faucet values

TODO, define:

- fund limit (the minimum amount of ugnot the account needs to have for playing)
- send amount (the amount of ugnot the faucet dishes out)
- token list (the acceptable token list)
