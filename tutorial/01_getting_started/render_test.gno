package getting_started

import (
	"strings"
	"testing"
)

func TestRender(t *testing.T) {
	res := strings.ToLower(Render("hello"))
	if !strings.Contains(res, "hello") || !strings.Contains(res, "world") {
		t.Errorf("%q does not contain hello world", res)
	}
}
