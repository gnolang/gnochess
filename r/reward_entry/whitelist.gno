package reward_entry

import "std"

// XXX: Update as required
var whitelist = []string{
	"g1jg8mtutu9khhfwc4nxmuhcpftf0pajdhfvsqf5",
}

func assertIsWhiteListed(address std.Address) {
	for _, e := range whitelist {
		if e == address.String() {
			return
		}
	}
	panic("restricted access")
}
