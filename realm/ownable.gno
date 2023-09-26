package chess

import "std"

func TransferOwnership(newOwner std.Address) string {
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
