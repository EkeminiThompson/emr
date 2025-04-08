FROM node:16 as builder
WORKDIR /app
COPY package*.json .
RUN npm install --production
COPY . .

FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app .
USER node

EXPOSE 5000
CMD ["node", "server.js"]