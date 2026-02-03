FROM node:20-alpine

# Prisma needs OpenSSL on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and root tsconfig (api's tsconfig extends ../../tsconfig.json)
COPY package.json package-lock.json tsconfig.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies without running postinstall (api's postinstall runs prisma generate, but schema isn't copied yet)
RUN npm ci --ignore-scripts

# Copy source files
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build shared package first (API depends on it), then the API
RUN npm run build --workspace=@bugsnap/shared && npm run build --workspace=apps/api

# Expose port
EXPOSE 3001

# Start ONLY the API workspace
CMD ["npm", "run", "start", "--workspace=apps/api"]