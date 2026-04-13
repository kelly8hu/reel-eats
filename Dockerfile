FROM node:22-alpine

WORKDIR /app

# Copy entire monorepo (node_modules excluded via .dockerignore)
COPY . .

# Install all workspace deps from root
RUN npm install --workspaces

WORKDIR /app/server

EXPOSE 3000

CMD ["npx", "tsx", "src/index.ts"]
