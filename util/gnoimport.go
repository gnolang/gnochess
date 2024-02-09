//go:build none

// File exists to import gno repository in go.mod

package main

import (
	_ "github.com/gnolang/gno/contribs/gnodev"
	_ "github.com/gnolang/gno/gno.land/cmd/gnokey"
	_ "github.com/gnolang/gno/gnovm/cmd/gno"
)
