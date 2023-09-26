package chess

func checkMigrated() {
	if migrated {
		msg := "realm has migrated to " + string(migratedTo)
		panic(msg)
	}
}

func Migrate(newRealmPath string) string {
	// TODO add check for path validity

	if !isOwner() {
		panic("not owner")
	}

	migrated = true
	migratedTo = newRealmPath
	return "successfully migrated to " + newRealmPath
}

func GetMigration() string {
	if migratedTo == "" {
		return "realm has not migrated"
	}
	return migratedTo
}

// testing commands, todo remove
//gnokey maketx call \
//--pkgpath "gno.land/r/demo/chess" \
//--func "GetMigration" \
//--gas-fee 10000000ugnot \
//--gas-wanted 800000 \
//--broadcast  \
//--remote localhost:26657 \
//DeployKey
//
//gnokey maketx call \
//--pkgpath "gno.land/r/demo/chess" \
//--func "GetOwner" \
//--gas-fee 10000000ugnot \
//--gas-wanted 800000 \
//--broadcast  \
//--remote localhost:26657 \
//DeployKey
//
//gnokey maketx call \
//--pkgpath "gno.land/r/demo/chess" \
//--func "Migrate" \
//--args "gno.land/r/demo/chessV2" \
//--gas-fee 10000000ugnot \
//--gas-wanted 8000000 \
//--broadcast  \
//--remote localhost:26657 \
//DeployKey
//
//gnokey maketx call \
//--pkgpath "gno.land/r/demo/chess" \
//--func "ClaimTimeout" \
//--args "gameID" \
//--gas-fee 10000000ugnot \
//--gas-wanted 800000 \
//--broadcast  \
//--remote localhost:26657 \
//DeployKey
//
//gnokey maketx call \
//--pkgpath "gno.land/r/demo/chess" \
//--func "RetrieveRealmState" \
//--gas-fee 10000000ugnot \
//--gas-wanted 800000 \
//--broadcast  \
//--remote localhost:26657 \
//DeployKey

//gnokey maketx call \
//--pkgpath "gno.land/r/demo/chess" \
//--func "TransferOwnership" \
//--args "g16ux7z75l2tejxps772ycz7uw7c4s8w3er3500c" \
//--gas-fee 10000000ugnot \
//--gas-wanted 8000000 \
//--broadcast  \
//--remote localhost:26657 \
//DeployKey
