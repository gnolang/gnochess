package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"os"
	"regexp"
	"strconv"

	"github.com/gnolang/faucet"
	tm2Client "github.com/gnolang/faucet/client/http"
	"github.com/gnolang/faucet/config"
	"github.com/gnolang/faucet/estimate/static"
	"github.com/gnolang/gno/tm2/pkg/std"
	"github.com/pelletier/go-toml"
	"go.uber.org/zap"

	"github.com/peterbourgon/ff/v3/ffcli"
)

const (
	defaultGasFee    = "1000000ugnot"
	defaultGasWanted = "100000"
	defaultRemote    = "http://127.0.0.1:26657"
)

var remoteRegex = regexp.MustCompile(`^https?://[a-z\d.-]+(:\d+)?(?:/[a-z\d]+)*$`)

type rootCfg struct {
	configPath string
	remote     string
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

	// Validate the remote address
	if !remoteRegex.MatchString(cfg.remote) {
		return errors.New("invalid remote address")
	}

	// Create a new logger
	logger, err := zap.NewDevelopment()
	if err != nil {
		return err
	}

	// Create a new faucet with
	// static gas estimation
	f, err := faucet.NewFaucet(
		static.New(gasFee, gasWanted),
		tm2Client.NewClient(cfg.remote),
		faucet.WithLogger(newCommandLogger(logger)),
		faucet.WithConfig(faucetConfig),
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
