# Build the Frontend [dist folder]
# Copy the dist folder contents in Backend/public folder

FROM node:20-alpine as frontend-builder

COPY ./client /app

WORKDIR /app

RUN npm install

RUN npm run build


# Build the Backend
FROM node:20-alpine

COPY ./server /app

WORKDIR /app

RUN npm install


# Copy the dist folder contents from frontend-builder to Backend/public folder
COPY --from=frontend-builder /app/dist /app/public

CMD ["node", "server.js"]