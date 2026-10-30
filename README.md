# Toy Scan 小程序

基于 Figma Make 原型实现的玩具车 3D 扫描小程序示例。前端使用 Taro + React + TypeScript，后端使用 Flask + SQLite。

当前版本完成了项目列表、状态筛选、10 个视角的拍摄/相册选择、照片上传、生成进度、模型预览、重新生成等基础流程。AI/三维重建接口暂未接入，后端使用可替换的本地进度桩模拟生成过程。

## 版本基线

| 运行时 / 核心库 | 固定版本 | 兼容性说明 |
| --- | --- | --- |
| Node.js | 22.21.1 (bookworm-slim) | LTS；glibc 兼容 Taro 4.2.1 的 Linux 原生绑定 |
| npm | 10.9.4 | Node 官方镜像内置版本，并通过 `packageManager` 固定 |
| Python | 3.12.16 | Flask 3.1.2 支持 Python 3.9+ |
| Taro | 4.2.1 | 所有 `@tarojs/*` 包保持同一版本 |
| React | 18.3.1 | 使用 Taro 4 的稳定 React 适配组合 |
| Flask | 3.1.2 | 与 Python 3.12 兼容 |

Dockerfile 通过 `docker.1ms.run` 拉取完整补丁版本镜像，前端依赖使用精确版本并提交 `package-lock.json`，Python 完整依赖树保存在 `requirements.lock`，避免重建时自动升级。

## 目录结构

```text
car-scan/
├─ frontend/                  # Taro 小程序
│  ├─ config/                 # Taro 构建配置
│  └─ src/
│     ├─ components/          # 通用视觉组件
│     ├─ constants/           # 10 个拍摄视角等常量
│     ├─ pages/index/         # 单页状态流入口
│     ├─ screens/             # 项目、拍摄、生成、预览页面
│     ├─ services/            # Flask API 调用
│     └─ types/               # 前端领域类型
├─ backend/                   # Flask API
│  ├─ app/
│  │  ├─ __init__.py          # 应用工厂
│  │  ├─ db.py                # SQLite 连接与初始化
│  │  └─ projects.py          # 项目、照片、生成接口
│  ├─ tests/                  # API 测试
│  ├─ uploads/                # 本地上传目录
│  └─ run.py                  # 开发启动入口
└─ docs/project-structure.md  # 更详细的结构说明
```

## Docker 开发环境

```powershell
docker compose up --build
```

启动后可访问：

- Flask API：`http://127.0.0.1:5000`
- Taro H5 预览：`http://127.0.0.1:10086`
- 健康检查：`GET http://127.0.0.1:5000/api/health`

源码通过 volume 挂载，前后端都支持开发期热更新。本机不需要单独安装 Python、Node.js 或 npm。

## 微信小程序构建

```powershell
docker compose run --rm frontend npm run build:weapp
```

然后在微信开发者工具中打开 `frontend/dist`。真机调试时，把 `.env.development.example` 复制为 `.env.development`，并将 API 地址改成同一局域网内可访问的后端地址；微信小程序还需要在管理后台配置合法请求域名。

## 验证

```powershell
docker compose run --rm backend python -m pytest
docker compose run --rm frontend npm run typecheck
docker compose run --rm frontend npm run build:weapp
```

## AI 接口替换点

目前 `POST /api/projects/:id/generate` 和 `POST /api/projects/:id/regenerate` 仅启动本地进度桩。接入真实 AI 服务时，保留现有接口响应结构，在 `backend/app/projects.py` 的生成入口中投递任务，并让项目查询接口返回真实任务进度即可。

