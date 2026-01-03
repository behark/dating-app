# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app
RUN npm run web:build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npx", "serve", "-s", "web-build", "-l", "3000"]