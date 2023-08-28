package chess

import (
	"std"
	"testing"
)

func TestNewGame(t *testing.T) {
	g := NewGame(std.DerivePkgAddr("xx"))
	println(g)
}
