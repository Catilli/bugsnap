FROM node:20-alpine

# Prisma needs OpenSSL; bcrypt needs build tools for native bindings
RUN apk add --no-cache openssl && apk add --no-cache --virtual .build-deps python3 make g++

WORKDIR /app

# Copy package files and root tsconfig (api's tsconfig extends ../../tsconfig.json)
COPY package.json package-lock.json tsconfig.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Copy Prisma schema so postinstall (prisma generate) can run
COPY apps/api/prisma ./apps/api/prisma

# Install dependencies (scripts run: prisma generate + bcrypt native build)
RUN npm ci && apk del .build-deps

# Copy source files
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build shared package first (API depends on it), then the API
RUN npm run build --workspace=@bugsnap/shared && npm run build --workspace=apps/api

# Expose port
EXPOSE 3001

# Start ONLY the API workspace
CMD ["npm", "run", "start", "--workspace=apps/api"]