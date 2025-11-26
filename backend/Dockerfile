# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client (without database connection)
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies + tsx for running seed
RUN npm ci --only=production && \
    npm install -D tsx @types/node @types/bcrypt

# Copy Prisma schema and generate client
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Start command
CMD ["sh", "-c", "echo 'DATABASE_URL:' && echo $DATABASE_URL | cut -c1-50 && npx prisma generate && npx prisma migrate deploy && npx prisma db seed && node dist/main"]
