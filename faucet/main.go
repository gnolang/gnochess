package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/signal"
	"regexp"
	"strconv"
	"strings"
	"syscall"

	"github.com/gnolang/faucet"
	"github.com/gnolang/faucet/client"
	tm2Client "github.com/gnolang/faucet/client/http"
	"github.com/gnolang/faucet/config"
	"github.com/gnolang/faucet/estimate/static"
	"github.com/peterbourgon/ff/v3"
	"github.com/peterbourgon/ff/v3/fftoml"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"

	"github.com/gnolang/gno/tm2/pkg/crypto"
	"github.com/gnolang/gno/tm2/pkg/std"

	"github.com/peterbourgon/ff/v3/ffcli"
)

const (
	defaultGasFee    = "1000000ugnot"
	defaultGasWanted = "100000"
	defaultFundLimit = "100ugnot"
	defaultRemote    = "http://127.0.0.1:26657"
)

const (
	tokenKey = "faucet-token"

	envPrefix      = "GNOCHESS_FAUCET_"
	configFlagName = "config"
)

var remoteRegex = regexp.MustCompile(`^https?://[a-z\d.-]+(:\d+)?(?:/[a-z\d]+)*$`)

type rootCfg struct {
	listenAddress string
	chainID       string
	mnemonic      string
	sendAmount    string
	numAccounts   uint64

	remote    string
	fundLimit string

	redisURL string

	allowedTokens stringArr // TODO temporary
}

// generateFaucetConfig generates the Faucet configuration
// based on the flag data
func (c *rootCfg) generateFaucetConfig() *config.Config {
	// Create the default configuration
	cfg := config.DefaultConfig()

	// Set up the CORS config
	corsConfig := config.DefaultCORSConfig()

	// Allow a custom header field
	corsConfig.AllowedHeaders = append(corsConfig.AllowedHeaders, tokenKey)

	cfg.CORSConfig = corsConfig
	cfg.ListenAddress = c.listenAddress
	cfg.ChainID = c.chainID
	cfg.Mnemonic = c.mnemonic
	cfg.SendAmount = c.sendAmount
	cfg.NumAccounts = c.numAccounts

	return cfg
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
		Options: []ff.Option{
			// Allow using ENV variables
			ff.WithEnvVars(),
			ff.WithEnvVarPrefix(envPrefix),

			// Allow using TOML config files
			ff.WithAllowMissingConfigFile(true),
			ff.WithConfigFileFlag(configFlagName),
			ff.WithConfigFileParser(fftoml.Parser),
		},
	}

	if err := cmd.ParseAndRun(context.Background(), os.Args[1:]); err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "%+v", err)

		os.Exit(1)
	}
}

// registerFlags registers the main configuration flags
func registerFlags(fs *flag.FlagSet, c *rootCfg) {
	// Top level flags
	fs.StringVar(
		&c.listenAddress,
		"listen-address",
		config.DefaultListenAddress,
		"the IP:PORT URL for the faucet server",
	)

	fs.StringVar(
		&c.chainID,
		"chain-id",
		config.DefaultChainID,
		"the chain ID associated with the remote Gno chain",
	)

	fs.StringVar(
		&c.mnemonic,
		"mnemonic",
		"",
		"the mnemonic for faucet keys",
	)

	fs.Uint64Var(
		&c.numAccounts,
		"num-accounts",
		config.DefaultNumAccounts,
		"the number of faucet accounts, based on the mnemonic",
	)

	fs.StringVar(
		&c.sendAmount,
		"send-amount",
		config.DefaultSendAmount,
		"the static send amount (native currency)",
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

	fs.StringVar(
		&c.redisURL,
		"redis-url",
		"redis://127.0.0.1:6379",
		"redis connection string",
	)

	// TODO temporary
	fs.Var(
		&c.allowedTokens,
		"tokens",
		"the allowed faucet tokens",
	)
}

// execMain starts the GnoChess faucet
func execMain(cfg *rootCfg) error {
	// Parse static gas values.
	// It is worth noting that this is temporary,
	// and will be removed once gas estimation is enabled
	// on Gno.land
	gasFee := std.MustParseCoin(defaultGasFee)

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

	// Prepare the middlewares
	var middlewares []faucet.Middleware

	if len(cfg.allowedTokens) != 0 {
		// TODO temporary for testing purpose without redis
		middlewares = append(middlewares, prepareTokenListMiddleware(cfg.allowedTokens))
	} else {
		redisOpts, err := redis.ParseURL(cfg.redisURL)
		if err != nil {
			return err
		}
		redisClient := redis.NewClient(redisOpts)

		middlewares = append(middlewares, prepareTokenMiddleware(redisClient))
	}
	// Call prepareFundMiddleware last to avoid funding users with invalid tokens
	middlewares = append(middlewares, prepareFundMiddleware(cli, fundLimit))

	// Create a new faucet with
	// static gas estimation
	f, err := faucet.NewFaucet(
		static.New(gasFee, gasWanted),
		cli,
		faucet.WithLogger(newCommandLogger(logger)),
		faucet.WithConfig(cfg.generateFaucetConfig()),
		faucet.WithMiddlewares(middlewares),
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

// prepareFundMiddleware prepares the fund (balance) validation middleware
func prepareFundMiddleware(client client.Client, fundLimit std.Coins) faucet.Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Parse the request to extract the address
			var request faucet.Request

			body, err := io.ReadAll(r.Body)
			if err != nil {
				http.Error(w, "Error reading request body", http.StatusInternalServerError)

				return
			}

			// Close the original body
			if err := r.Body.Close(); err != nil {
				http.Error(w, "Error closing request body", http.StatusInternalServerError)

				return
			}

			// Create a new ReadCloser from the read bytes
			// so that future middleware will be able to read
			r.Body = io.NopCloser(bytes.NewReader(body))

			// Decode the original request
			if err := json.NewDecoder(bytes.NewBuffer(body)).Decode(&request); err != nil {
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

				return
			}

			accountBalance := account.GetCoins()
			if accountBalance != nil && accountBalance.IsAllGTE(fundLimit) {
				// User has enough funds already, block the request
				http.Error(w, "User is funded", http.StatusForbidden)

				return
			}

			// Continue with serving the faucet request
			next.ServeHTTP(w, r)
		})
	}
}

// TODO temporary
// prepareTokenListMiddleware prepares the token validation middleware
func prepareTokenListMiddleware(tokens []string) faucet.Middleware {
	// Create the token map
	tokenMap := make(map[string]struct{}, len(tokens))

	// Add in the token values
	for _, token := range tokens {
		tokenMap[token] = struct{}{}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Fetch the faucet token
			token := r.Header.Get(tokenKey)

			// Make sure the token is valid
			if _, valid := tokenMap[token]; !valid {
				http.Error(w, "Invalid faucet token", http.StatusForbidden)

				return
			}

			// Continue with serving the faucet request
			next.ServeHTTP(w, r)
		})
	}
}

// prepareTokenMiddleware prepares the token validation middleware
func prepareTokenMiddleware(redisClient *redis.Client) faucet.Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Fetch the faucet token
			token := r.Header.Get(tokenKey)

			res, err := redisClient.HGet(r.Context(), "TOKEN:"+token, "used").Result()
			if err != nil {
				http.Error(w, "Invalid faucet token", http.StatusForbidden)
				return
			} else if res == "true" {
				http.Error(w, "Already claimed", http.StatusForbidden)
				return
			}

			_, err = redisClient.HSet(r.Context(), "TOKEN:"+token, "used", "true").Result()
			if err != nil {
				http.Error(w, "Unable to lock token", http.StatusInternalServerError)
				return
			}

			// Parse the request to extract the address
			// XXX copied from prepareFundMiddleware, don't have time to refactor without unit tests!
			var request faucet.Request
			body, err := io.ReadAll(r.Body)
			if err != nil {
				http.Error(w, "Error reading request body", http.StatusInternalServerError)
				return
			}
			// Close the original body
			if err := r.Body.Close(); err != nil {
				http.Error(w, "Error closing request body", http.StatusInternalServerError)
				return
			}
			// Create a new ReadCloser from the read bytes
			// so that future middleware will be able to read
			r.Body = io.NopCloser(bytes.NewReader(body))
			// Decode the original request
			if err := json.NewDecoder(bytes.NewBuffer(body)).Decode(&request); err != nil {
				http.Error(w, "Invalid request", http.StatusBadRequest)
				return
			}

			// Read email
			email, err := redisClient.HGet(r.Context(), "TOKEN:"+token, "email").Result()
			if err != nil {
				http.Error(w, "Unable to read token email", http.StatusInternalServerError)
				return
			}
			// Store gno adress, email and token, so they are retrievable via the
			// getEmail middleware.
			err = redisClient.HSet(r.Context(), "GNO:"+request.To, "email", email, "token", token).Err()
			if err != nil {
				http.Error(w, "Unable to set gno address and email", http.StatusInternalServerError)
				return
			}

			// Continue with serving the faucet request
			next.ServeHTTP(w, r)
		})
	}
}

// TODO temporary

// stringArr defines the custom flag type
// that represents an array of string values
type stringArr []string

// String is a required output method for the flag
func (s *stringArr) String() string {
	if len(*s) <= 0 {
		return "..."
	}

	return strings.Join(*s, ", ")
}

// Set is a required output method for the flag.
// This is where our custom type manipulation actually happens
func (s *stringArr) Set(value string) error {
	*s = append(*s, value)

	return nil
}
