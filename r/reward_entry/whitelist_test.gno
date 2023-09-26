package reward_entry

import (
	"std"
	"testing"
)

func TestAssertIsWhiteListed(t *testing.T) {
	// Override whitelist for testing
	whitelist = []string{std.Address("address1"), std.Address("address2"), std.Address("address3")}

	// Test with a valid address
	validAddress := std.Address("address1")
	assertIsWhiteListed(validAddress) // This should not panic

	// Test with an invalid address; should cause a panic
	invalidAddress := std.Address("invalid_address")
	func() {
		defer func() {
			if r := recover(); r == nil {
				t.Errorf("expected panic for invalid address")
			}
		}()
		assertIsWhiteListed(invalidAddress)
	}()

	// Test with an empty whitelist; should cause a panic
	whitelist = []string{}
	func() {
		defer func() {
			if r := recover(); r == nil {
				t.Errorf("expected panic for empty whitelist")
			}
		}()
		assertIsWhiteListed(validAddress)
	}()
}
