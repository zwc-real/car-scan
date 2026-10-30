FROM docker.1ms.run/library/node:22.21.1-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

EXPOSE 10086
CMD ["npm", "run", "dev:h5", "--", "--host", "0.0.0.0", "--port", "10086"]

