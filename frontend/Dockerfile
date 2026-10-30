FROM docker.1ms.run/library/node:22.21.1-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
COPY docker-entrypoint.sh /usr/local/bin/car-scan-entrypoint.sh
# Windows 检出可能产生 CRLF；只规范镜像内脚本，不改宿主机文件。
RUN sed -i 's/\r$//' /usr/local/bin/car-scan-entrypoint.sh

EXPOSE 10086
ENTRYPOINT ["sh", "/usr/local/bin/car-scan-entrypoint.sh"]
CMD ["npm", "run", "dev:h5", "--", "--host", "0.0.0.0", "--port", "10086"]

