package chess

func checkMigrated() {
	if migrated {
		msg := "realm has migrated to " + migratedTo
		panic(msg)
	}
}

func Migrate(newRealmPath string) string {
	if newRealmPath == "" {
		panic("new realm path cannot be empty")
	}

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
