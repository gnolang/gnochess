package reward_entry

import (
	"sort"
	"std"
	"time"

	"gno.land/p/demo/avl"
	"gno.land/p/demo/ufmt"
)

var entries avl.Tree // address -> *RewardEntry

// RewardEntry represents a reward entry
type RewardEntry struct {
	address std.Address
	points  uint64
	reason  string

	updatedAt time.Time
	updatedBy std.Address
}

func SetRewardEntry(address std.Address, points uint64, reason string) {
	std.AssertOriginCall()
	caller := std.GetOrigCaller()
	assertIsWhiteListed(caller)

	entry := &RewardEntry{
		address: address,
		points:  points,
		reason:  reason,

		updatedAt: time.Now(),
		updatedBy: caller,
	}
	entries.Set(address.String(), entry)
}

func rewardEntrySorted() []RewardEntry {
	sorted := []RewardEntry{}
	entries.Iterate("", "", func(key string, value interface{}) bool {
		entry := value.(*RewardEntry)
		i := sort.Search(len(sorted), func(i int) bool { return sorted[i].points <= entry.points })
		if i > len(sorted) && sorted[i].points == entry.points {
			i++
		}
		sorted = append(sorted, RewardEntry{})
		copy(sorted[i+1:], sorted[i:])
		sorted[i] = *entry
		return false
	})

	return sorted
}

func Render(path string) string {
	switch {
	case path == "":
		entries := rewardEntrySorted()
		return markdown(entries)
	default:
		return "404\n"
	}
}

func markdown(in []RewardEntry) string {
	res := "# Reward entries:\n\n"

	if len(in) == 0 {
		res += "*No reward entry found*\n"
		return res
	}

	// Create a table header
	res += "| Address         | Points    | Reason          | Updated-by | Updated-at |\n"
	res += "| --------------- | --------- | --------------- | ---------- | ---------- |\n"

	// Iterate over reward entries and format them as Markdown rows
	for _, entry := range in {
		updatedAt := entry.updatedAt.Format(time.UnixDate)
		row := ufmt.Sprintf("| %s | %dpoints | %s | %s | %s |\n", entry.address.String(), entry.points, entry.reason, entry.updatedBy.String(), updatedAt)
		res += row
	}

	return res
}
