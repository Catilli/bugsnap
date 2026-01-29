FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci

# Copy source files
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build the API
RUN npm run build

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "run", "start"]