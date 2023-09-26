package reward_entry

import (
	"std"
	"strings"
	"testing"

	"gno.land/p/demo/ufmt"
)

func TestRewardEntry(t *testing.T) {
	// Override whitelist for testing
	whitelist = []string{std.Address("address1"), std.Address("address2"), std.Address("address3")}

	// Add reward entry for `foo`` and `bar``
	std.TestSetOrigCaller(std.Address("address1"))
	SetRewardEntry("foo", 1000, "oof")
	SetRewardEntry("bar", 1500, "rab")

	// `address2` modify foo's points
	std.TestSetOrigCaller(std.Address("address2"))
	SetRewardEntry("foo", 1200, "oof; 200 more for good handwriting")

	// `unauthorized` address tries to modify foo's points
	std.TestSetOrigCaller(std.Address("unauthorized"))
	func() {
		defer func() {
			if r := recover(); r == nil {
				t.Errorf("expected panic for unauthorized address")
			}
		}()
		SetRewardEntry("foo", 1200, "oof")
	}()

	// Note: Render() prints entries in sorted order
	// (sorted by points; high -> low)
	expectedRows := []string{
		"# Reward entries:",
		"",
		"| Address         | Points    | Reason          | Updated-by | Updated-at |",
		"| --------------- | --------- | --------------- | ---------- |",
		"| bar | 1500points | rab | address1 |",
		"| foo | 1200points | oof; 200 more for good handwriting | address2 |",
	}

	out := Render("")
	// Split the actual output into rows
	actualRows := strings.Split(out, "\n")

	// Check each row one by one
	for i, expectedRow := range expectedRows {
		if !strings.HasPrefix(actualRows[i], expectedRow) {
			t.Errorf("Row %d does not match:\nExpected:\n%s\nGot:\n%s", i+1, expectedRow, actualRows[i])
		}
	}
}
