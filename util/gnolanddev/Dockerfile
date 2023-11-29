FROM ghcr.io/gnolang/gno:latest

# entr: hot reloading
# dumb-init: signal handling, pid 1
# rsync: used by run.sh to intelligently copy files
# git, golang: used for applying patches and re-build gno binaries following that
RUN apt-get update && \
	apt-get install -y entr dumb-init rsync git golang

# symlinked by run.sh
ENV GNOROOT="/opt/gnoroot"

# XXX: apply patch from PR #1048.
WORKDIR /opt/gno/src
ADD ./pull-1048-assertorigincall.diff .
RUN git apply ./pull-1048-assertorigincall.diff && \
	go build -o /opt/gno/bin/gnoland ./gno.land/cmd/gnoland && \
	go build -o /opt/gno/bin/gno ./gnovm/cmd/gno

# XXX: add strconv float functions (needed for FormatFloat)
ADD ./strconv ./gnovm/stdlibs/strconv

WORKDIR /opt/gnoroot
CMD [ "dumb-init", "sh", "-c", "while true; do find /mnt -name '*.gno' | entr -drn /run.sh; done" ]
ADD ./run.sh /run.sh
