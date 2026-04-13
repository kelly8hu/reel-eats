FROM node:22-alpine

WORKDIR /app

# Copy workspace root and all packages needed for install
COPY package.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install all workspace deps from root
RUN npm install --workspaces

# Copy source
COPY shared/ ./shared/
COPY server/ ./server/

WORKDIR /app/server

EXPOSE 3000

CMD ["npx", "tsx", "src/index.ts"]
