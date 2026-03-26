FROM node:22-alpine

WORKDIR /app

ENV CI=true

RUN npm install -g pnpm@latest

COPY . .

RUN pnpm install --frozen-lockfile

CMD ["pnpm", "dev"]
