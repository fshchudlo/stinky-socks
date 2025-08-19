FROM node:lts-alpine

RUN adduser -S appuser

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY packages/importer/package*.json ./packages/importer/

# Install dependencies
RUN npm ci

# Copy the rest of the files
COPY . .

# Build and test the importer package
WORKDIR /app/packages/importer
RUN npm run build && npm run test

USER appuser

EXPOSE 9100

CMD ["npm", "start"]
