package chess

import "std"

// TransferOwnership
// Warning: Use carefully - if owner is misconfigured, realm will be bricked
func TransferOwnership(newOwner std.Address) string {
	if newOwner == "" {
		panic("new owner cannot be empty")
	}

	if !isOwner() {
		panic("not owner")
	}

	owner = newOwner
	return "new owner is " + string(owner)
}

func isOwner() bool {
	caller := std.GetOrigCaller()
	if caller != GetOwner() {
		return false
	}
	return true
}

func GetOwner() std.Address {
	return owner
}
