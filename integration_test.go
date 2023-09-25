package main

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"time"

	integration "github.com/gnolang/gno/gno.land/pkg/integration"
	"github.com/jaekwon/testify/require"
	"github.com/rogpeppe/go-internal/testscript"
)

var balances = []string{
	"g1plqds6kxnfaqcpky0gtt6fpntfhjgcfx8r73a0=100000000000000000ugnot",
	"g1sgy2zhqg2wecuz3qt8th63d539afagjnhs4zj3=100000000000000000ugnot",
	"g1unk9a8yt595p4yxpfpejewvf9lx6yrvd2ylgtm=100000000000000000ugnot",
	"g17x4qwuhmc6fyp6ut2qtscc9265xe5jnj83s8c6=100000000000000000ugnot",
	"g1agq8t3289xxmm63z55axykmmve2pz87yqgyn5n=100000000000000000ugnot",
	"g153xesqpfvr5y35l0aykew3796kz452zttp0xt2=100000000000000000ugnot",
	"g18epncd7avkhmdlf930e4t2p7c7j9qdv3yda93f=100000000000000000ugnot",
	"g1elguymy8sjjy246u09qddtx587934k6uzf8mc4=100000000000000000ugnot",
	"g1sl70rzvu49mp0lstxaptmvle8h2a8rx8pu56uk=100000000000000000ugnot",
	"g18dgugclk93v65qtxxus82eg30af59fgk246nqy=100000000000000000ugnot",
}

func generateGenesisFile(genesispath, target string) error {
	genesis, err := os.ReadFile(genesispath)
	if err != nil {
		return fmt.Errorf("Error reading genesis file: %w", err)
	}

	outputFile, err := os.Create(target)
	if err != nil {
		return fmt.Errorf("Error creating output file: %w", err)
	}
	defer outputFile.Close()

	writer := bufio.NewWriter(outputFile)
	writer.Write(genesis)
	writer.WriteRune('\n')
	writer.WriteRune('\n')

	for _, line := range balances {
		writer.Write([]byte(line))
		writer.WriteRune('\n')
	}

	return nil
}

func TestTestdata(t *testing.T) {
	ts := integration.SetupGnolandTestScript(t, "testdata")

	goModPath, err := exec.Command("go", "env", "GOMOD").CombinedOutput()
	require.NoError(t, err)

	oldsetup := ts.Setup
	ts.Setup = func(e *testscript.Env) error {
		oldsetup(e)
		e.Setenv("ROOTDIR", filepath.Dir(string(goModPath)))

		rootdir := e.Getenv("GNOROOT")
		tmpdir := e.Getenv("TMPDIR")

		outpout_genesis := filepath.Join(tmpdir, "genesis_balances.txt")
		input_genesis := filepath.Join(rootdir, "gno.land/genesis/genesis_balances.txt")
		if err := generateGenesisFile(input_genesis, outpout_genesis); err != nil {
			return fmt.Errorf("unable to generate genesis file: %w", err)
		}

		return nil
	}

	ts.Cmds["sleep"] = func(ts *testscript.TestScript, neg bool, args []string) {
		d := time.Second
		if len(args) > 0 {
			var err error
			if d, err = time.ParseDuration(args[0]); err != nil {
				ts.Fatalf("uanble to parse duration %q: %s", args[1], err)
			}
		}

		time.Sleep(d)
	}

	testscript.Run(t, ts)
}
