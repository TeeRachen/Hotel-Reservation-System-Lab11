# Compile TypeScript with development dependencies.
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
# src/ already contains the generated Prisma client (src/generated/prisma),
# so no `prisma generate` step is needed here.
COPY src ./src
RUN npm run build
 
# Keep only runtime dependencies and compiled JavaScript.
FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 8080
CMD ["node", "dist/main.js"]