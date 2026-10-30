# Toy Scan 小程序

基于 Figma Make 原型实现的玩具车 3D 扫描小程序示例。前端使用 Taro + React + TypeScript，后端使用 Flask + SQLite。

当前版本完成了项目列表、状态筛选、10 个视角的拍摄/相册选择、照片上传、生成进度、模型预览、重新生成等基础流程。AI/三维重建接口暂未接入，后端使用可替换的本地进度桩模拟生成过程。

界面已按新版 `Untitled (2).zip` 更新为纸色直角布局，包含项目纵向列表、两列拍摄网格、分段生成进度和真实 GLB 预览。所有项目暂时共用提供的沙发测试模型，页面标注“测试占位模型”，并非 AI 重建结果。

## 版本基线

| 运行时 / 核心库 | 固定版本 | 兼容性说明 |
| --- | --- | --- |
| Node.js | 22.21.1 (bookworm-slim) | LTS；glibc 兼容 Taro 4.2.1 的 Linux 原生绑定 |
| npm | 10.9.4 | Node 官方镜像内置版本，并通过 `packageManager` 固定 |
| Python | 3.12.16 | Flask 3.1.2 支持 Python 3.9+ |
| Taro | 4.2.1 | 所有 `@tarojs/*` 包保持同一版本 |
| React | 18.3.1 | 使用 Taro 4 的稳定 React 适配组合 |
| Flask | 3.1.2 | 与 Python 3.12 兼容 |
| Three.js / 类型 | 0.160.1 / 0.160.0 | 同一 r160 系列；仅用于 H5，支持 WebGL 1/2；微信端使用内置 XR-Frame |

Dockerfile 通过 `docker.1ms.run` 拉取完整补丁版本镜像，前端依赖使用精确版本并提交 `package-lock.json`，Python 完整依赖树保存在 `requirements.lock`，避免重建时自动升级。

## 目录结构

```text
car-scan/
├─ frontend/                  # Taro 小程序
│  ├─ config/                 # Taro 构建配置
│  └─ src/
│     ├─ assets/icons/        # 新版原型线稿图标
│     ├─ components/          # 通用视觉组件
│     ├─ constants/           # 10 个拍摄视角等常量
│     ├─ native/glb-scene/    # 微信原生 XR-Frame 模型组件
│     ├─ pages/index/         # 单页状态流入口
│     ├─ screens/             # 项目、拍摄、生成、预览页面
│     ├─ services/            # Flask API 调用
│     └─ types/               # 前端领域类型
├─ backend/                   # Flask API
│  ├─ app/
│  │  ├─ __init__.py          # 应用工厂
│  │  ├─ db.py                # SQLite 连接与初始化
│  │  ├─ models.py            # 占位模型元数据及支持 Range 的文件接口
│  │  └─ projects.py          # 项目、照片、生成接口
│  ├─ assets/models/          # GLB 测试资产，由后端提供
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

前端依赖绑定到宿主机 `frontend/node_modules`，VS Code 可以直接读取包和 TypeScript 类型。首次启动、`package-lock.json` 或容器 Node/系统版本变化时，入口脚本自动在挂载目录运行 `npm ci`，之后重启会复用已安装的依赖。首次安装完成后，若编辑器仍提示缺少类型，可执行 VS Code 的 `TypeScript: Restart TS Server`。

依赖由 Linux 容器安装；宿主机用于编辑和类型识别，构建与测试仍在 Docker 中执行。更新依赖请使用 `docker compose exec frontend npm install --save-exact 包名@版本`，不要在 Windows 中再次安装到同一个目录，以免混入不兼容的原生二进制。

## 微信小程序构建

```powershell
docker compose run --rm frontend npm run build:weapp
```

然后在微信开发者工具中打开 `frontend/dist`。真机调试时，把 `.env.development.example` 复制为 `.env.development`，并将 API 地址改成同一局域网内可访问的后端地址；微信小程序还需要在管理后台配置合法请求域名。

小程序产物固定输出到 `frontend/dist`，H5 输出到 `frontend/dist-h5`，避免 Docker 中启动 H5 服务时清空小程序文件。尺寸以 430px 设计稿为准，按 `750 / 430` 换算为 rpx；微信端按窗口、状态栏及胶囊按钮位置预留安全区，H5 桌面限宽样式不会打入小程序产物。

XR-Frame 组件必须保留 `index.js/json/wxml/wxss` 四个文件，并在应用配置中启用 `lazyCodeLoading: 'requiredComponents'`。即使组件不使用常规样式，也不能删除 `index.wxss`，否则微信开发者工具可能报 `Cannot generate sub context file app-wxss.js`。`build:weapp` 完成后会自动检查这些产物；生产构建的 WXSS 可以为空文件。

## GLB 测试模型

提供的 `Meshy_AI_Emerald_Tufted_Cheste_1030053958_texture.glb` 保存为 `backend/assets/models/placeholder.glb`，约 34.3 MiB、310052 个三角面、2 张内嵌 PBR 贴图。`GET /api/models/placeholder` 返回实际文件信息，`GET /api/models/placeholder.glb` 提供 GLB，并支持 ETag 缓存和 Range 请求。大文件由后端提供，不占用小程序代码包。

H5 使用同版本 Three.js GLTFLoader + OrbitControls，支持鼠标/触摸旋转、滚轮/双指缩放、自动旋转、白模切换和根据视口自动取景。离开预览页时释放动画、纹理、几何与 WebGL 资源；下载失败可重试。

微信端使用官方 XR-Frame 原生组件。手势参考微信官方 [xr-template-arPreview 示例](https://github.com/wechat-miniprogram/miniprogram-demo/tree/master/miniprogram/packageXRFrame/components/template/xr-template-arPreview)，固定相机，单指位移直接更新模型 Transform，双指按距离比例缩放；不使用内置轨道控制器或手动旋转惯性。触摸即暂停自动旋转，松手后保持角度。手动旋转灵敏度在 `frontend/src/native/glb-scene/index.js` 顶部的 `ROTATE_SPEED` 调整，当前为 `5`，与官方 demo 一致；数值越大越快，`2.5` 为 demo 的一半、`10` 为两倍，横向和纵向共用此参数，不影响缩放与自动旋转。修改后重新运行 `npm run build:weapp`（在 Docker 中执行）。请使用支持 XR-Frame 的微信基础库，并在真机上验证；构建通过不代表原生 GPU 渲染已经过真机测试。真机必须把 `TARO_APP_API_BASE_URL` 改为手机可访问的后端地址（不能使用手机自身的 `127.0.0.1`），并按微信要求配置 HTTPS 合法域名。当前模型较大，首次加载耗时取决于网络与设备。

## 验证

```powershell
docker compose run --rm backend python -m pytest
docker compose run --rm frontend npm run typecheck
docker compose run --rm frontend npm run build:weapp
docker compose run --rm frontend npm run check:weapp-layout
docker compose run --rm frontend npm run check:weapp-components
docker compose run --rm frontend npm run test:weapp-interaction
docker compose run --rm frontend npm run test:weapp-interaction -- --dist
```

## AI 接口替换点

目前 `POST /api/projects/:id/generate` 和 `POST /api/projects/:id/regenerate` 仅启动本地进度桩。接入真实 AI 服务时，保留现有接口响应结构，在 `backend/app/projects.py` 的生成入口中投递任务，并让项目查询接口返回真实任务进度即可。

