package chess

import (
	"bytes"
	"errors"
	"math"
	"std"
	"strconv"
	"time"

	"gno.land/p/demo/chess"
	"gno.land/p/demo/chess/glicko2"
	"gno.land/r/demo/users"
)

// This file contains a bunch of JSON marshalers.
// These should disappear eventually!
// https://github.com/gnolang/gno/issues/1655

func (g Game) MarshalJSON() (_ []byte, err error) {
	var b bytes.Buffer
	b.WriteByte('{')

	nilAddr := func(na *std.Address) string {
		if na == nil {
			return `null`
		}
		return `"` + na.String() + `"`
	}
	mjson := func(s string, val interface{ MarshalJSON() ([]byte, error) }, comma bool) {
		if err != nil {
			return
		}
		var res []byte
		res, err = val.MarshalJSON()
		if err != nil {
			return
		}
		b.WriteString(`"` + s + `":`)
		b.Write(res)
		if comma {
			b.WriteByte(',')
		}
	}

	b.WriteString(`"id":"` + g.ID + `",`)
	b.WriteString(`"white":"` + g.White.String() + `",`)
	b.WriteString(`"black":"` + g.Black.String() + `",`)

	mjson("position", jsonPosition{g.Position}, true)
	mjson("state", g.State, true)
	mjson("winner", g.Winner, true)
	if err != nil {
		return
	}

	b.WriteString(`"creator":"` + g.Creator.String() + `",`)
	b.WriteString(`"created_at":"` + g.CreatedAt.Format(time.RFC3339) + `",`)
	b.WriteString(`"draw_offerer":` + nilAddr(g.DrawOfferer) + ",")
	b.WriteString(`"concluder":` + nilAddr(g.Concluder) + ",")

	mjson("time", g.Time, false)
	if err != nil {
		return
	}

	b.WriteByte('}')
	return b.Bytes(), nil
}

type jsonPosition struct {
	chess.Position
}

func (p jsonPosition) MarshalJSON() ([]byte, error) {
	var b bytes.Buffer
	b.WriteByte('{')

	bfen := p.EncodeFEN()
	b.WriteString(`"fen":"` + bfen + `",`)

	b.WriteString(`"moves":[`)

	for idx, m := range p.Moves {
		b.WriteString(`"` + m.String() + `"`)
		if idx != len(p.Moves)-1 {
			b.WriteByte(',')
		}
	}

	b.WriteByte(']')
	b.WriteByte('}')
	return b.Bytes(), nil
}

func (w Winner) MarshalJSON() ([]byte, error) {
	if n := int(w); n < len(winnerString) {
		return []byte(`"` + winnerString[n] + `"`), nil
	}
	return nil, errors.New("invalid winner value")
}

func (g GameState) MarshalJSON() ([]byte, error) {
	if int(g) >= len(gameStatesSnake) {
		return nil, errors.New("invalid game state")
	}
	return []byte(`"` + gameStatesSnake[g] + `"`), nil
}

func (tc *TimeControl) MarshalJSON() ([]byte, error) {
	if tc == nil {
		return []byte("null"), nil
	}
	var buf bytes.Buffer

	buf.WriteByte('{')
	buf.WriteString(`"seconds":` + strconv.Itoa(tc.Seconds) + `,`)
	buf.WriteString(`"increment":` + strconv.Itoa(tc.Increment) + `,`)
	buf.WriteString(`"started_at":"` + tc.StartedAt.Format(time.RFC3339) + `",`)

	buf.WriteString(`"move_timestamps":[`)
	for idx, mt := range tc.MoveTimestamps {
		buf.WriteString(`"` + mt.Format(time.RFC3339) + `"`)
		if idx != len(tc.MoveTimestamps)-1 {
			buf.WriteByte(',')
		}
	}
	buf.WriteString("],")

	buf.WriteString(`"white_time":` + strconv.FormatInt(tc.WhiteTime.Milliseconds(), 10) + ",")
	buf.WriteString(`"black_time":` + strconv.FormatInt(tc.BlackTime.Milliseconds(), 10))
	buf.WriteByte('}')

	return buf.Bytes(), nil
}

func (p Player) MarshalJSON() ([]byte, error) {
	u := users.GetUserByAddress(p.Address)

	var buf bytes.Buffer
	buf.WriteByte('{')

	buf.WriteString(`"address":"` + p.Address.String() + `",`)
	if u == nil {
		buf.WriteString(`"username":"",`)
	} else {
		buf.WriteString(`"username":"` + u.Name() + `",`)
	}

	for idx, cat := range categoryList {
		stat := p.CategoryInfo[cat]
		buf.WriteString(`"` + cat.String() + `":{`)
		buf.WriteString(`"wins":` + strconv.Itoa(stat.Wins) + ",")
		buf.WriteString(`"losses":` + strconv.Itoa(stat.Losses) + ",")
		buf.WriteString(`"draws":` + strconv.Itoa(stat.Draws) + ",")
		buf.WriteString(`"rating":`)
		if res, err := (jsonPlayerRating{stat.PlayerRating}).MarshalJSON(); err != nil {
			return nil, err
		} else {
			buf.Write(res)
		}
		buf.WriteByte(',')
		buf.WriteString(`"position":` + strconv.Itoa(p.LeaderboardPosition(cat)))
		buf.WriteByte('}')
		if idx != len(categoryList)-1 {
			buf.WriteByte(',')
		}
	}

	buf.WriteByte('}')
	return buf.Bytes(), nil
}

type jsonPlayerRating struct{ *glicko2.PlayerRating }

func (p jsonPlayerRating) MarshalJSON() ([]byte, error) {
	var buf bytes.Buffer
	buf.WriteByte('{')
	buf.WriteString(`"rating":` + formatFloat(p.Rating, 5) + `,`)
	buf.WriteString(`"deviation":` + formatFloat(p.RatingDeviation, 5) + `,`)
	buf.WriteString(`"volatility":` + formatFloat(p.RatingVolatility, 5))
	buf.WriteByte('}')
	return buf.Bytes(), nil
}

// XXX: dumb formatFloat implementation while we don't have strconv.FormatFloat
// https://github.com/gnolang/gno/pull/1464
func formatFloat(f float64, decimals int) string {
	if decimals > 10 {
		decimals = 10
	}
	neg := ""
	if f < 0 {
		f *= -1
		neg = "-"
	}
	const zeroes = "0000000000" // 10 zeroes
	whole := math.Floor(f)
	fractional := f - whole
	leading := strconv.Itoa(int(whole))
	trailing := strconv.Itoa(int(fractional * 1e10))
	trailing = zeroes[:10-len(trailing)] + trailing
	return neg + leading + "." + trailing
}
