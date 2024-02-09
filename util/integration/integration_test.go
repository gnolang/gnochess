package integ

import (
	"testing"

	integration "github.com/gnolang/gno/gno.land/pkg/integration"
)

func TestIntegration(t *testing.T) {
	t.Skip("Integration tests are currently disabled: https://github.com/gnolang/gnochess/issues/209")
	integration.RunGnolandTestscripts(t, "testdata")
}
