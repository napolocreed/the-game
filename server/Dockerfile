# Push notification server for The Game — built for Cloud Run.
FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Cloud Run injects PORT; the server reads it (defaults to 4000 locally).
EXPOSE 4000
CMD ["node", "index.js"]
