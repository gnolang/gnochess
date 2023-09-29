package raffle

import (
	"std"
	"bytes"
)

type Player struct {
	Address string
	Games   int
	Won     int
	Moves   int
}

// See stats.sh
var gameStats = []Player{
	{Address: "g10g4j45qh00xl25jv3mfvn06hwqd2w3z63lhp3z", Games: 8, Won: 2, Moves: 49},
	{Address: "g10nxc05whcdq0qqce7qdlm6qr54s38pa525aml9", Games: 6, Won: 2, Moves: 52},
	{Address: "g12dyz0earm78csa22m9gg8zu9e3j5pdwxsg0lpz", Games: 2, Won: 0, Moves: 101},
	{Address: "g12sk735l4vylju0fyvrlxp0ty6x2zngdx0rq8cp", Games: 1, Won: 0, Moves: 26},
	{Address: "g13dluvs47t9hst4ut3pth2zysxd30yg4jxuk8pq", Games: 2, Won: 1, Moves: 16},
	{Address: "g13qy4t5ftwttuncmf8r4aupvkhsv4yz035vpngs", Games: 1, Won: 0, Moves: 2},
	{Address: "g13xa3xgvc0kjwzz4q2vh7rqae5236jfte8zuwwp", Games: 2, Won: 1, Moves: 13},
	{Address: "g143hfyaujhhjccjp3lse9dnpcm6wx352r7exddd", Games: 1, Won: 1, Moves: 5},
	{Address: "g15q7jvxuwj9g6z28rjvta8szpy59rwr2j4u4s35", Games: 2, Won: 0, Moves: 37},
	{Address: "g16a9huvaz346m2mcky9qqrxjap9zgu3flds7lwy", Games: 3, Won: 0, Moves: 29},
	{Address: "g17czruc9zktqapul3uw64ytzjfpgw55sdzf5r6d", Games: 4, Won: 1, Moves: 31},
	{Address: "g17h44x3clskaffd3jyvrjqdqf7rqyqktkam4apz", Games: 3, Won: 0, Moves: 18},
	{Address: "g17t3pwkc5zlv2wpyy9ejglx08nkmeysswlzva95", Games: 1, Won: 1, Moves: 23},
	{Address: "g1836rvfupqtsesp2kagjyyf6qqqutargpf6ctct", Games: 2, Won: 0, Moves: 82},
	{Address: "g18phej688l37xct3xvtjqgxrw572e54z9uuwn0f", Games: 2, Won: 0, Moves: 87},
	{Address: "g1980ynl7nf9l2dqycv4h48rg7kwhtqsnnmf64qc", Games: 1, Won: 0, Moves: 16},
	{Address: "g19dc5vdwpxyd47kwv24xhvwrft85n60ndmzzdlj", Games: 1, Won: 0, Moves: 34},
	{Address: "g19sj9kfvh6zqep03w36ceml0lyj0z4wvma9zvrj", Games: 7, Won: 4, Moves: 178},
	{Address: "g19uetquysuepzqplwjuwk88cwx6fn366jukrp0l", Games: 7, Won: 1, Moves: 13},
	{Address: "g1aer39kzu2y3vn0r29ha0xwere0j4armfykq550", Games: 4, Won: 0, Moves: 6},
	{Address: "g1dq7maz6s4u9dl83w9m2ule3hmnesks05gze0t9", Games: 7, Won: 3, Moves: 98},
	{Address: "g1e3ly4sn4hlmfznk4wuzzv364sexyjgmwpfyxvf", Games: 1, Won: 0, Moves: 22},
	{Address: "g1e8f0qjpc2suvlr5w4eh7n3cd2qqkc7drrtpxpc", Games: 1, Won: 0, Moves: 15},
	{Address: "g1epjgahndfs03l2xh039q8e2sh9cxjk4zs6rs7j", Games: 1, Won: 1, Moves: 24},
	{Address: "g1fj4f8l0cvnrr4kezg7peehl0w443pelg4l6jgh", Games: 5, Won: 4, Moves: 81},
	{Address: "g1g3q00ttusjq37xq6pmmyjghpgrvh8d5tx4fnjv", Games: 2, Won: 0, Moves: 42},
	{Address: "g1hn2lt6fm32hz649tcpnglj9vf76hhcdm24mzld", Games: 1, Won: 1, Moves: 28},
	{Address: "g1hu8ljfp9jy9mjqk40kp4czquxgm6d20pyd2qnh", Games: 14, Won: 3, Moves: 180},
	{Address: "g1j666qal2m0nc43lchvugfzyfae9zwzmcs3rz5u", Games: 2, Won: 1, Moves: 25},
	{Address: "g1j8ynm8wtepgavmumz6mqdwwdz497cgxm3q4u28", Games: 1, Won: 1, Moves: 42},
	{Address: "g1k3tjcv4qrppmcu0lakeajvtv2a48rq0g829hm3", Games: 2, Won: 0, Moves: 28},
	{Address: "g1kg9rap8pwq4hm0vcvnce7h0t83v6eyvlxw3rzh", Games: 3, Won: 1, Moves: 122},
	{Address: "g1lk0dxctssev0qk38s3srwdsxyzan05w56m8su3", Games: 7, Won: 0, Moves: 116},
	{Address: "g1lpwn02rye66hxhucu9vxaaasfqxnnxpyq299ps", Games: 2, Won: 0, Moves: 28},
	{Address: "g1mgv9wm690y2u9wnftmanvud3sswapk9whgytp3", Games: 7, Won: 2, Moves: 80},
	{Address: "g1mh500lggcs0kjnlrpkep2utr64at0fn898xvjk", Games: 2, Won: 2, Moves: 77},
	{Address: "g1n0ww38vqsp2x6ug8a0pz0xy8q3k7rymnn9p7zn", Games: 1, Won: 1, Moves: 28},
	{Address: "g1n779p33tl4fk26d930mjujfkhj7egamkt5ulrq", Games: 4, Won: 0, Moves: 13},
	{Address: "g1q7qrpknm2j4p2alzwrm4exusn0mu42a5csgl7w", Games: 1, Won: 1, Moves: 91},
	{Address: "g1q897pse9ydnqemdzj2jcdkhyvmy69rnym47rjs", Games: 2, Won: 0, Moves: 47},
	{Address: "g1qflx9sz23uwhgfzc9nwansmjxzefcf9uz405te", Games: 1, Won: 1, Moves: 28},
	{Address: "g1r6fpgswlaruxj0gf4v9ysasq5em2dkz58t2mum", Games: 2, Won: 2, Moves: 78},
	{Address: "g1rm3p9ydyalnhrn3086v4qvytxaz7y77v4uxl6k", Games: 2, Won: 0, Moves: 46},
	{Address: "g1rpx2mqwadf99eh3hjge9p4agq553u2z06asean", Games: 10, Won: 1, Moves: 95},
	{Address: "g1rw3xhm9rj57kp8nvm9dymmp0wmzqccuamwyujz", Games: 4, Won: 1, Moves: 130},
	{Address: "g1s2z3mmeyvfq67elvsul9quykwxxyapugxq0u59", Games: 4, Won: 2, Moves: 72},
	{Address: "g1s4l82evwejekwwa9a6ncg446fcs4rl7tsrs4wr", Games: 1, Won: 1, Moves: 27},
	{Address: "g1srxf9xfcd8adw8cvh9qtvpaqgqn6hj9av2ry94", Games: 16, Won: 3, Moves: 175},
	{Address: "g1tdnv6wzylf5fdex30d8qrf6f32frvulsjpr63z", Games: 2, Won: 1, Moves: 37},
	{Address: "g1tms8wn24607cx9vqas3qmzdtlrp0jpj0m7zjr3", Games: 13, Won: 5, Moves: 162},
	{Address: "g1v4tszzk9enpkzs6ny6tpmkqcvf3zaf8jhdrxxy", Games: 1, Won: 0, Moves: 28},
	{Address: "g1vd8ehalmjqx2srtdl6sp6hhuxpv9d32ucau08t", Games: 1, Won: 0, Moves: 6},
	{Address: "g1vdd0kynqpf238x7sta9m9xkfhe4xeq6zer0uq4", Games: 1, Won: 1, Moves: 30},
	{Address: "g1vm8cdj7wwk2a5vrs63taknsam0ay79shp2qun4", Games: 2, Won: 1, Moves: 34},
	{Address: "g1vrypwq2dufqx304rt73r9zwy8znyxy26lr93u3", Games: 4, Won: 0, Moves: 16},
	{Address: "g1w7h5y2wqnxx2sdr9d3kp7z9h7g4k0ayl6jzakr", Games: 1, Won: 0, Moves: 18},
	{Address: "g1x4z70yuu4l20djfyerln2h43gtacwqcezm6rs3", Games: 3, Won: 2, Moves: 54},
	{Address: "g1x90eh5ejc22548hjqznm2egyvn8ny36lqu460f", Games: 3, Won: 1, Moves: 47},
	{Address: "g1y6ejp9u4y2fjr2pae34kztj94husktcy3stw6v", Games: 6, Won: 2, Moves: 174},
	{Address: "g1yae7fm4svf9zfnzasv3jvvrzv98fewhg7h032r", Games: 2, Won: 1, Moves: 76},
	{Address: "g1yjv65t0q6fg2mpatatuecwhd3h0zekc9mrc763", Games: 3, Won: 1, Moves: 69},

	// Workshop pariticipants (no chess playing!)
	{Address: "w1"},
	{Address: "w2"},
	{Address: "w3"},
	{Address: "w4"},
	{Address: "w5"},
	{Address: "w6"},
	{Address: "w7"},
	{Address: "w8"},
	{Address: "w9"},
}

type Extra struct {
	Address string
	Value   int
}

var extraPoints = []Extra{
	// Workshop Participation
	{Address: "g10nxc05whcdq0qqce7qdlm6qr54s38pa525aml9", Value: 2500},
	{Address: "g1k3tjcv4qrppmcu0lakeajvtv2a48rq0g829hm3", Value: 2500},
	{Address: "g1qflx9sz23uwhgfzc9nwansmjxzefcf9uz405te", Value: 2500},
	{Address: "g1srxf9xfcd8adw8cvh9qtvpaqgqn6hj9av2ry94", Value: 2500},

	// Workshop participation (no chess playing!).
	// Addresses are sequential, in a private file containing the participants' emails.
	{Address: "w1", Value: 2500},
	{Address: "w2", Value: 2500},
	{Address: "w3", Value: 2500},
	{Address: "w4", Value: 2500},
	{Address: "w5", Value: 2500},
	{Address: "w6", Value: 2500},
	{Address: "w7", Value: 2500},
	{Address: "w8", Value: 2500},
	{Address: "w9", Value: 2500},

	// GitHub participation (Thanks!)
	{Address: "w9", Value: 2000},                                      // @heycait -- 2 PRs
	{Address: "g1vdd0kynqpf238x7sta9m9xkfhe4xeq6zer0uq4", Value: 900}, // @capacitive - 9 opened issues
}

func Score(addr string) int64 {
	v := int64(0)
	for _, gs := range gameStats {
		if gs.Address == addr {
			v += int64(gs.Games*100 + gs.Won*150 + gs.Moves)
			break
		}
	}
	for _, ep := range extraPoints {
		if ep.Address == addr {
			v += int64(ep.Value)
		}
	}
	return v
}

var winners []string

type raffleBlock struct {
	addr string
	max  int64 // non-inc
}

func init() {
	src := &rngSource{}
	src.Seed(
		int64(len(extraPoints)+len(gameStats)) + std.GetHeight(),
	)

	l := int64(0)
	blocks := []raffleBlock{}
	findBlocks := func(v int64) string {
		prev := blocks[0].addr
		for i := 1; i < len(blocks); i++ {
			if blocks[i].max > v {
				return prev
			}
			prev = blocks[i].addr
		}
		return prev
	}
	for _, us := range gameStats {
		sc := Score(us.Address)
		l += sc
		blocks = append(blocks, raffleBlock{
			addr: us.Address,
			max:  l,
		})
	}
	done := map[string]bool{}

	for i := 0; i < len(gameStats)-1; i++ {
		for {
			v := src.Int63() % l
			addr := findBlocks(v)
			if done[addr] {
				continue
			}
			done[addr] = true
			winners = append(winners, addr)
			break
		}
	}
}

func Winners() string {
	var buf bytes.Buffer
	for _, winner := range winners {
		buf.WriteString(winner)
		buf.WriteByte('\n')
	}
	return buf.String()
}
