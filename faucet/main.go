package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"regexp"
	"strconv"
	"syscall"

	"github.com/gnolang/faucet"
	"github.com/gnolang/faucet/client"
	tm2Client "github.com/gnolang/faucet/client/http"
	"github.com/gnolang/faucet/config"
	"github.com/gnolang/faucet/estimate/static"
	"github.com/gnolang/gno/tm2/pkg/crypto"
	"github.com/gnolang/gno/tm2/pkg/std"
	"github.com/pelletier/go-toml"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"

	"github.com/peterbourgon/ff/v3/ffcli"
)

const (
	defaultGasFee    = "1000000ugnot"
	defaultGasWanted = "100000"
	defaultFundLimit = "100ugnot"
	defaultRemote    = "http://127.0.0.1:26657"
)

var remoteRegex = regexp.MustCompile(`^https?://[a-z\d.-]+(:\d+)?(?:/[a-z\d]+)*$`)

type rootCfg struct {
	configPath string
	remote     string
	fundLimit  string
}

func main() {
	var (
		cfg = &rootCfg{}
		fs  = flag.NewFlagSet("pipeline", flag.ExitOnError)
	)

	// Register the flags
	registerFlags(fs, cfg)

	cmd := &ffcli.Command{
		ShortUsage: "<flags>",
		LongHelp:   "Starts the GnoChess faucet",
		FlagSet:    fs,
		Exec: func(_ context.Context, _ []string) error {
			return execMain(cfg)
		},
	}

	if err := cmd.ParseAndRun(context.Background(), os.Args[1:]); err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "%+v", err)

		os.Exit(1)
	}
}

// registerFlags registers the main configuration flags
func registerFlags(fs *flag.FlagSet, c *rootCfg) {
	fs.StringVar(
		&c.configPath,
		"faucet-config",
		"",
		"the config file for the faucet (TOML)",
	)

	fs.StringVar(
		&c.remote,
		"remote",
		defaultRemote,
		"the JSON-RPC URL of the Gno chain",
	)

	fs.StringVar(
		&c.fundLimit,
		"fund-limit",
		defaultFundLimit,
		"the minimum amount of ugnot the account needs to have",
	)
}

// execMain starts the GnoChess faucet
func execMain(cfg *rootCfg) error {
	// Make sure the config path is set
	if cfg.configPath == "" {
		return errors.New("faucet config not provided")
	}

	// Read the config
	faucetConfig, err := readConfig(cfg.configPath)
	if err != nil {
		return fmt.Errorf("unable to read config, %w", err)
	}

	// Parse static gas values.
	// It is worth noting that this is temporary,
	// and will be removed once gas estimation is enabled
	// on Gno.land
	gasFee, err := std.ParseCoin(defaultGasFee)
	if err != nil {
		return fmt.Errorf("invalid gas fee, %w", err)
	}

	gasWanted, err := strconv.ParseInt(defaultGasWanted, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid gas wanted, %w", err)
	}

	// Parse the fund limit
	fundLimit, err := std.ParseCoins(cfg.fundLimit)
	if err != nil {
		return fmt.Errorf("invalid fund limit, %w", err)
	}

	// Validate the remote address
	if !remoteRegex.MatchString(cfg.remote) {
		return errors.New("invalid remote address")
	}

	// Create a new logger
	logger, err := zap.NewDevelopment()
	if err != nil {
		return err
	}

	// Create the client (HTTP)
	cli := tm2Client.NewClient(cfg.remote)

	// Prepare the middleware
	middleware := prepareMiddleware(cli, fundLimit)

	// Create a new faucet with
	// static gas estimation
	f, err := faucet.NewFaucet(
		static.New(gasFee, gasWanted),
		cli,
		faucet.WithLogger(newCommandLogger(logger)),
		faucet.WithConfig(faucetConfig),
		faucet.WithMiddlewares([]faucet.Middleware{middleware}),
	)
	if err != nil {
		return fmt.Errorf("unable to create faucet, %w", err)
	}

	// Create a new waiter
	w := newWaiter()

	// Add the faucet service
	w.add(f.Serve)

	// Wait for the faucet to exit
	return w.wait()
}

// readConfig reads the faucet configuration
// from the specified path
func readConfig(path string) (*config.Config, error) {
	// Read the config file
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	// Parse it
	var faucetConfig config.Config

	if err := toml.Unmarshal(content, &faucetConfig); err != nil {
		return nil, err
	}

	return &faucetConfig, nil
}

type cmdLogger struct {
	logger *zap.Logger
}

func newCommandLogger(logger *zap.Logger) *cmdLogger {
	return &cmdLogger{
		logger: logger,
	}
}

func (c *cmdLogger) Info(msg string, args ...interface{}) {
	if len(args) == 0 {
		c.logger.Info(msg)

		return
	}

	c.logger.Info(msg, zap.Any("args", args))
}

func (c *cmdLogger) Debug(msg string, args ...interface{}) {
	if len(args) == 0 {
		c.logger.Debug(msg)

		return
	}

	c.logger.Debug(msg, zap.Any("args", args))
}

func (c *cmdLogger) Error(msg string, args ...interface{}) {
	if len(args) == 0 {
		c.logger.Error(msg)

		return
	}

	c.logger.Error(msg, zap.Any("args", args))
}

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

// prepareMiddleware prepares the fund validation middleware
func prepareMiddleware(client client.Client, fundLimit std.Coins) faucet.Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Parse the request to extract the address
			var request faucet.Request

			if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
				http.Error(w, "Invalid request", http.StatusBadRequest)

				return
			}

			// Extract the beneficiary address
			beneficiary, err := crypto.AddressFromBech32(request.To)
			if err != nil {
				http.Error(w, "Invalid request", http.StatusBadRequest)

				return
			}

			// Validate the user does not have >x ugnot already
			account, err := client.GetAccount(beneficiary)
			if err != nil {
				http.Error(w, "Unable to fetch user", http.StatusInternalServerError)
			}

			accountBalance := account.GetCoins()
			if accountBalance.IsAllGTE(fundLimit) {
				// User has enough funds already, block the request
				http.Error(w, "User is funded", http.StatusForbidden)

				return
			}

			// Continue with serving the faucet request
			next.ServeHTTP(w, r)
		})
	}
}
