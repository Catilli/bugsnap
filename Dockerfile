FROM node:20-alpine

WORKDIR /app

# Copy package files (all workspaces required for npm ci lockfile)
# Explicit package.json + package-lock.json so lockfile is always present; Node 20 has npm 10 (matches packageManager)
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies (workspace-aware)
RUN npm ci

# Copy source files
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build ONLY the API workspace
RUN npm run build --workspace=apps/api

# Expose port
EXPOSE 3001

# Start ONLY the API workspace
CMD ["npm", "run", "start", "--workspace=apps/api"]