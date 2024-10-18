FROM node:22-alpine

WORKDIR /app

COPY package.json /app/
COPY yarn.lock /app/

RUN yarn install --production && yarn cache clean

COPY . /app

ENV NODE_ENV production
ENTRYPOINT ["node", "-r", "esm", "./bin/server", "--port", "9003", "--secure", "true"]
# ENTRYPOINT ["./start_server.sh"]