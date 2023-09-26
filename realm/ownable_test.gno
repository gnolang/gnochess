package chess

import (
	"std"
	"testing"
)

func TestTransferOwnership_NotOwner(t *testing.T) {
	std.TestSetOrigCaller("g185rxzrsc0j69amfsl255k2fxtlnt3cw8f3eu6h") // random address

	defer func() {
		if r := recover(); r == nil {
			t.Error("Expected TransferOwnership to panic with not owner, but did not")
		}
	}()

	TransferOwnership("newOwner")
}

func TestTransferOwnership_EmptyNewOwner(t *testing.T) {
	std.TestSetOrigCaller("g1wymu47drhr0kuq2098m792lytgtj2nyx77yrsm")

	defer func() {
		if r := recover(); r == nil {
			t.Error("Expected TransferOwnership to panic with empty new owner, but did not")
		}
	}()

	TransferOwnership("")
}

func TestTransferOwnership(t *testing.T) {
	// Note:
	// it seems that this address is the result of std.GetOrigCaller() in the init function when testing
	// will open up an issue to address this
	std.TestSetOrigCaller("g1wymu47drhr0kuq2098m792lytgtj2nyx77yrsm")

	if GetOwner() != "g1wymu47drhr0kuq2098m792lytgtj2nyx77yrsm" {
		t.Fatal("original owner not correct")
	}

	TransferOwnership("g185rxzrsc0j69amfsl255k2fxtlnt3cw8f3eu6h")

	if GetOwner() != "g185rxzrsc0j69amfsl255k2fxtlnt3cw8f3eu6h" {
		t.Fatal("new owner not set correctly")
	}
}
