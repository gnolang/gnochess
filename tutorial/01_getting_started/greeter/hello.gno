// You did it! You're looking at the documentation for greeter.
package greeter

import (
	"time"
)

// Hello greets s, returning different greetings throughout the day.
func Hello(s string) string {
	n := time.Now()
	v := "The time is " + time.Now().Format("Mon Jan _2 15:04:05.00000 MST 2006") + ".\n\n"
	hour := n.Hour()
	switch {
	default:
		v += "Good night, "
	case hour >= 5 && hour < 12:
		v += "Good morning, "
	case hour >= 12 && hour < 17:
		v += "Good afternoon, "
	case hour >= 17 && hour < 22:
		v += "Good evening, "
	}
	return v + s
}
