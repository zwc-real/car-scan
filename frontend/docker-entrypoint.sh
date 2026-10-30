#!/bin/sh
set -eu

cd /app
# 空目录绑定会遮住镜像内的依赖，首次启动必须在挂载目录中安装。
# 同时校验锁文件与运行时，避免复用 Windows/其他 Node 版本安装的原生模块。
stamp="node_modules/.docker-npm-ci"
lock_hash="$(sha256sum package-lock.json | cut -d ' ' -f 1)"
signature="$(node --version):$(uname -sm):$lock_hash"
if [ ! -x node_modules/.bin/taro ] || [ ! -f "$stamp" ] || [ "$(cat "$stamp")" != "$signature" ]; then
  npm ci --prefer-offline --no-audit --no-fund
  printf '%s' "$signature" > "$stamp"
fi

exec "$@"
