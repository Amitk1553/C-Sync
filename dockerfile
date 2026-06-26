FROM node:20-alpine

COPY ./server .

RUN npm install

CMD ["node", "server.js"]