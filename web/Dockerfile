FROM node:20-bookworm

RUN apt-get update && \
	apt-get install -y hugo dumb-init && \
	mkdir /app

WORKDIR /app

COPY package.json package-lock.json .

RUN npm install

COPY . /app

CMD ["dumb-init", "npm", "run", "dev"]
