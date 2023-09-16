package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"golang.org/x/sync/errgroup"
)

type waitFunc func(ctx context.Context) error

// waiter is a concept used for waiting on running services
type waiter struct {
	ctx    context.Context
	cancel context.CancelFunc

	waitFns []waitFunc
}

// newWaiter creates a new waiter instance
func newWaiter() *waiter {
	w := &waiter{
		waitFns: []waitFunc{},
	}

	w.ctx, w.cancel = signal.NotifyContext(
		context.Background(),
		os.Interrupt,
		syscall.SIGINT,
		syscall.SIGTERM,
		syscall.SIGQUIT,
	)

	return w
}

// add adds a new wait service
func (w *waiter) add(fns ...waitFunc) {
	w.waitFns = append(w.waitFns, fns...)
}

// wait blocks until all added wait services finish
func (w *waiter) wait() error {
	g, ctx := errgroup.WithContext(w.ctx)

	g.Go(func() error {
		<-ctx.Done()
		w.cancel()

		return nil
	})

	for _, fn := range w.waitFns {
		fn := fn

		g.Go(
			func() error {
				return fn(ctx)
			},
		)
	}

	return g.Wait()
}
