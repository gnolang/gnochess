package register

import (
	"std"
	"testing"

	"gno.land/p/demo/testutils"
)

func TestRegisterPlayer(t *testing.T) {
	// Setup
	var (
		faucetAddr  = std.Address("g1unk9a8yt595p4yxpfpejewvf9lx6yrvd2ylgtm")
		player1Addr = testutils.TestAddress("player1")
		player2Addr = testutils.TestAddress("player2")
		player3Addr = testutils.TestAddress("player3")
		banker      = std.GetBanker(std.BankerTypeReadonly)
	)
	std.TestSetOrigCaller(faucetAddr)
	std.TestIssueCoins(faucetAddr, std.Coins{{"ugnot", 123456789}})
	std.TestSetOrigSend(std.Coins{{"ugnot", 123456789}}, nil)

	// Check if the player is registered
	if IsAddressRegistered(player1Addr) {
		t.Fatal("player should not be registered")
	}

	// Register a player
	RegisterPlayer(player1Addr, "token1")

	// Check if the player is registered
	if !IsAddressRegistered(player1Addr) {
		t.Fatal("player should be registered")
	}

	// Check if player received tokens
	bal := banker.GetCoins(player1Addr)
	if bal.AmountOf("ugnot") != 123456789 {
		t.Fatal("failed to send tokens to the player")
	}

	// Check the generated realm Render output
	output := Render("")
	expected := "- g1wpkxz7t9wgc47h6lta047h6lta047h6lx675l0\n"
	if output != expected {
		t.Fatalf("expected %q, got %q.", expected, output)
	}
}
