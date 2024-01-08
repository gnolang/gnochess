// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

// export access to strconv internals for tests

package strconv

func NewDecimal(i uint64) *decimal {
	d := new(decimal)
	d.Assign(i)
	return d
}

func MulByLog2Log10(x int) int {
	return mulByLog2Log10(x)
}

func MulByLog10Log2(x int) int {
	return mulByLog10Log2(x)
}
