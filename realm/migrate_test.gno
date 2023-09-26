package chess

import (
	"std"
	"testing"
)

func TestMigrate(t *testing.T) {
	std.TestSetOrigCaller("g1wymu47drhr0kuq2098m792lytgtj2nyx77yrsm")
	if migrated != false || migratedTo != "" {
		t.Fatal("Bad init")
	}

	Migrate("gno.land/r/demo/chessV2")

	if migrated != true || migratedTo != "gno.land/r/demo/chessV2" {
		t.Fatal("Migration failed")
	}
}

func TestMigrate_EmptyPath(t *testing.T) {
	std.TestSetOrigCaller("g1wymu47drhr0kuq2098m792lytgtj2nyx77yrsm")

	defer func() {
		if r := recover(); r == nil {
			t.Error("Expected Migrate to panic with an empty path, but it didn't")
		}
	}()

	Migrate("")
}

func TestMigrate_BlockedFunction(t *testing.T) {
	std.TestSetOrigCaller("g1wymu47drhr0kuq2098m792lytgtj2nyx77yrsm")

	Migrate("example/path")

	defer func() {
		if r := recover(); r == nil {
			t.Error("Expected ClaimTimeout to panic with migrated realm, but did not")
		}
	}()

	// example blocked function
	ClaimTimeout("exampleGameID")
}
