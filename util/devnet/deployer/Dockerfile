FROM ghcr.io/gnolang/gno/gnochess:latest

RUN apt-get update && \
	apt-get install -y entr dumb-init

WORKDIR /
CMD [ "dumb-init", "./deployer.sh" ]

ADD ./deployer.sh /deployer.sh
