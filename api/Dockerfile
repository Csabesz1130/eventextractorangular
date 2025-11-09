FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY api/package.json api/yarn.lock* ./
RUN yarn install --frozen-lockfile

# Copy source
COPY api/ ./

# Generate Prisma client
RUN npx prisma generate

# Build
RUN yarn build

# Expose port
EXPOSE 8911

# Start server
CMD ["yarn", "rw", "serve", "api"]

