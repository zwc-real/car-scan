# 项目结构说明

```text
car-scan/
├─ frontend/
│  ├─ config/
│  │  ├─ index.ts             # 通用 Taro 配置
│  │  ├─ dev.ts               # 开发环境配置
│  │  └─ prod.ts              # 生产环境配置
│  ├─ src/
│  │  ├─ components/
│  │  │  ├─ MiniCar.tsx       # 列表车辆插画
│  │  │  ├─ ModelViewer.h5.tsx # Three.js GLB 预览与资源释放
│  │  │  ├─ ModelViewer.weapp.tsx # 微信原生组件适配
│  │  │  └─ ViewGuide.tsx     # 拍摄角度示意图
│  │  ├─ constants/views.ts   # 10 个标准拍摄视角
│  │  ├─ native/glb-scene/    # XR-Frame 原生组件（JS/WXML/JSON）
│  │  ├─ pages/index/
│  │  │  ├─ index.config.ts
│  │  │  ├─ index.scss
│  │  │  └─ index.tsx         # 页面状态机与数据刷新
│  │  ├─ screens/
│  │  │  ├─ CaptureScreen.tsx
│  │  │  ├─ GeneratingScreen.tsx
│  │  │  ├─ PreviewScreen.tsx
│  │  │  └─ ProjectsScreen.tsx
│  │  ├─ services/api.ts      # 请求、上传和错误归一化
│  │  ├─ types/project.ts
│  │  ├─ app.config.ts
│  │  ├─ app.scss
│  │  └─ app.tsx
│  ├─ package.json
│  └─ tsconfig.json
├─ backend/
│  ├─ app/
│  │  ├─ __init__.py          # Flask 应用工厂、CORS 与错误响应
│  │  ├─ db.py                # SQLite 生命周期和种子数据
│  │  ├─ models.py            # GLB 元数据、缓存与文件接口
│  │  └─ projects.py          # 项目领域 API
│  ├─ tests/test_api.py
│  ├─ tests/test_models.py     # GLB 头部、Range 和缓存验证
│  ├─ assets/models/placeholder.glb # 用户提供的真实测试模型
│  ├─ uploads/.gitkeep
│  ├─ requirements.txt
│  ├─ requirements-dev.txt
│  ├─ run.py
│  └─ Dockerfile
├─ docker-compose.yml         # 前后端 Docker 开发、构建与测试环境
├─ .gitignore
└─ README.md
```

## 设计取舍

- 前端只有一条核心用户旅程，因此使用单个 Taro 页面加轻量状态机，避免为四个步骤引入复杂路由或全局状态库。
- 后端只有项目与照片两个实体，使用 Flask Blueprint 和 SQLite 即可，不引入 ORM、任务队列或多层 Service/Repository。
- 上传文件保存在本地目录；生产部署时可把该处替换成对象存储。
- AI 任务未接入，以查询时计算的进度桩代替后台线程，开发环境无需额外进程。

