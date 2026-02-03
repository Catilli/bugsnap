FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

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