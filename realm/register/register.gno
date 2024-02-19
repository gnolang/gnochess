package register

import (
	"std"
	"strings"

	"gno.land/p/demo/avl"
)

var players = avl.Tree{} // player -> token

func RegisterPlayer(playerAddr std.Address, token string) {
	assertIsFaucet()

	if IsAddressRegistered(playerAddr) {
		panic("faucet already used")
	}
	players.Set(string(playerAddr), token)

	sent := std.GetOrigSend()
	banker := std.GetBanker(std.BankerTypeOrigSend)
	pkgaddr := std.GetOrigPkgAddr()
	banker.SendCoins(pkgaddr, playerAddr, sent)
}

func IsAddressRegistered(addr std.Address) bool {
	_, exists := players.Get(string(addr))
	return exists
}

func Render(_ string) string {
	var output strings.Builder
	players.Iterate("", "", func(key string, value interface{}) bool {
		// token := value.(string)
		output.WriteString("- " + key + "\n")
		return false
	})
	return output.String()
}

func assertIsFaucet() {
	caller := std.GetOrigCaller()
	switch caller {
	case std.Address("g1plqds6kxnfaqcpky0gtt6fpntfhjgcfx8r73a0"):
	case std.Address("g1sgy2zhqg2wecuz3qt8th63d539afagjnhs4zj3"):
	case std.Address("g1unk9a8yt595p4yxpfpejewvf9lx6yrvd2ylgtm"):
	case std.Address("g17x4qwuhmc6fyp6ut2qtscc9265xe5jnj83s8c6"):
	case std.Address("g1agq8t3289xxmm63z55axykmmve2pz87yqgyn5n"):
	case std.Address("g153xesqpfvr5y35l0aykew3796kz452zttp0xt2"):
	case std.Address("g18epncd7avkhmdlf930e4t2p7c7j9qdv3yda93f"):
	case std.Address("g1elguymy8sjjy246u09qddtx587934k6uzf8mc4"):
	case std.Address("g1sl70rzvu49mp0lstxaptmvle8h2a8rx8pu56uk"):
	case std.Address("g18dgugclk93v65qtxxus82eg30af59fgk246nqy"):
	default:
		panic("restricted area")
	}
}
