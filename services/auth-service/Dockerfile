FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm install typescript@5.2.2 && npx tsc

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
# If swagger.yaml exists, copy it
COPY src/swagger.yaml ./dist/swagger.yaml
EXPOSE 3000
CMD ["node", "dist/main.js"]
