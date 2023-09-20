package main

import (
	"flag"
	"fmt"

	"github.com/gnolang/gno/tm2/pkg/crypto"
	"github.com/gnolang/gno/tm2/pkg/crypto/bip39"
	"github.com/gnolang/gno/tm2/pkg/crypto/hd"
	"github.com/gnolang/gno/tm2/pkg/crypto/secp256k1"
)

func main() {
	mneminicPtr := flag.String("mnemonic", "", "the bip39 mnemonic")
	numAccountsPtr := flag.Uint64("num-accounts", 10, "the number of accounts to generate")

	flag.Parse()

	// Generate the accounts
	accounts := generateAccounts(*mneminicPtr, *numAccountsPtr)

	fmt.Printf("[Generated Accounts]\n\n")

	// Print them out
	for _, account := range accounts {
		fmt.Println(account.String())
	}

	fmt.Println()
}

// generateAccounts the accounts using the provided mnemonics
func generateAccounts(mnemonic string, numAccounts uint64) []crypto.Address {
	addresses := make([]crypto.Address, numAccounts)

	// Generate the seed
	seed := bip39.NewSeed(mnemonic, "")

	for i := uint64(0); i < numAccounts; i++ {
		key := generateKeyFromSeed(seed, uint32(i))
		address := key.PubKey().Address()

		addresses[i] = address
	}

	return addresses
}

// generateKeyFromSeed generates a private key from
// the provided seed and index
func generateKeyFromSeed(seed []byte, index uint32) crypto.PrivKey {
	pathParams := hd.NewFundraiserParams(0, crypto.CoinType, index)

	masterPriv, ch := hd.ComputeMastersFromSeed(seed)

	//nolint:errcheck // This derivation can never error out, since the path params
	// are always going to be valid
	derivedPriv, _ := hd.DerivePrivateKeyForPath(masterPriv, ch, pathParams.String())

	return secp256k1.PrivKeySecp256k1(derivedPriv)
}
