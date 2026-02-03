FROM node:20-alpine

# Prisma needs OpenSSL on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files (all workspaces required for npm ci lockfile)
# Explicit package.json + package-lock.json so lockfile is always present; Node 20 has npm 10 (matches packageManager)
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies without running postinstall (api's postinstall runs prisma generate, but schema isn't copied yet)
RUN npm ci --ignore-scripts

# Copy source files
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build ONLY the API workspace
RUN npm run build --workspace=apps/api

# Expose port
EXPOSE 3001

# Start ONLY the API workspace
CMD ["npm", "run", "start", "--workspace=apps/api"]