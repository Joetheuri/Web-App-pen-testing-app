FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json ./
COPY prisma ./prisma
RUN npm install

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && npm start"]
