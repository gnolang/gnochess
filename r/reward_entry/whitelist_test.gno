package reward_entry

import (
	"std"
	"testing"
)

func TestAssertIsWhiteListed(t *testing.T) {
	// Mock whitelist
	whitelist := []string{std.Address("address1"), std.Address("address2"), std.Address("address3")}

	// Test with a valid address
	validAddress := std.Address("address1")
	assertIsWhiteListed(validAddress) // This should not panic

	// // Test with an invalid address
	// invalidAddress := std.Address("invalid_address")

	// // This should cause a panic
	// func() {
	// 	defer func() {
	// 		if r := recover(); r == nil {
	// 			t.Errorf("Expected panic for invalid address, but the function did not panic")
	// 		}
	// 	}()
	// 	assertIsWhiteListed(invalidAddress)
	// }()

	// // Test with an empty whitelist
	// whitelist = []string{}

	// // This should cause a panic
	// func() {
	// 	defer func() {
	// 		if r := recover(); r == nil {
	// 			t.Errorf("Expected panic for empty whitelist, but the function did not panic")
	// 		}
	// 	}()
	// 	assertIsWhiteListed(validAddress)
	// }()
}
