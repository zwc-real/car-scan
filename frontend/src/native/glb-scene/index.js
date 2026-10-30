// 仅用于微信端的原生组件；模型通过网络加载，不进入小程序包体。
// 手势状态与 Transform 更新方式参考微信官方 xr-template-arPreview 示例：
// https://github.com/wechat-miniprogram/miniprogram-demo/tree/master/miniprogram/packageXRFrame/components/template/xr-template-arPreview

// 手动旋转灵敏度：5 与官方 demo 的 rotateSpeed 一致。
// 转角（弧度）= 手指位移 / ((场景宽 + 场景高) / 4) × ROTATE_SPEED。
// 数值越大转得越快；改为 2.5 是 demo 的一半，10 是两倍，不影响双指缩放和自动旋转。
const ROTATE_SPEED = 5

Component({
  properties: {
    src: String,
    clay: { type: Boolean, observer() { this.applyMaterial() } },
    auto: { type: Boolean, value: true, observer(value) {
      if (value) this.interacting = false
    } },
    width: { type: Number, observer() { this.fitCamera() } },
    height: { type: Number, observer() { this.fitCamera() } },
  },
  data: { loaded: false, cameraPosition: '3.4 1.8 4.5' },
  lifetimes: {
    detached() {
      if (this.scene && this.sceneListeners) {
        for (const [name, listener] of Object.entries(this.sceneListeners)) this.scene.event.remove(name, listener)
      }
      this.scene = null
      this.modelTransform = null
      this.yawTransform = null
      this.originals = null
    },
  },
  methods: {
    fitCamera() {
      if (!this.data.width || !this.data.height) return
      const halfFov = Math.atan(Math.tan(Math.PI / 9) * Math.min(1, this.data.width / this.data.height))
      const distance = 1.38 / Math.sin(halfFov) * 1.08
      this.setData({ cameraPosition: `0 0 ${distance}` })
    },
    handleReady({ detail }) {
      this.scene = detail.value
      const system = wx.getXrFrameSystem()
      this.modelTransform = this.scene.getElementById('preview-model').getComponent(system.Transform)
      this.yawTransform = this.scene.getElementById('preview-model-sub').getComponent(system.Transform)
      this.gesture = null
      // 原生画布的触摸未必冒泡到外层 Taro View，必须在 XR 内立即停止自动旋转。
      this.sceneListeners = {
        touchstart: event => {
          this.interacting = true
          this.startGesture(event.touches)
          this.triggerEvent('interact')
        },
        touchmove: event => {
          this.moveGesture(event.touches)
        },
        // 与官方示例一致：双指松开一指后不突然变成单指旋转，重新触摸才启动。
        touchend: () => { this.gesture = null },
        touchcancel: () => { this.gesture = null },
      }
      for (const [name, listener] of Object.entries(this.sceneListeners)) this.scene.event.add(name, listener)
      this.fitCamera()
    },
    startGesture(touches) {
      this.gesture = touches.length === 1 || touches.length === 2
        ? touches.map(touch => ({ identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY })) : null
    },
    moveGesture(touches) {
      if (!this.gesture || !this.modelTransform) return
      const previous = this.gesture
      if (touches.length !== previous.length || touches.some((touch, index) => touch.identifier !== previous[index].identifier)) {
        this.startGesture(touches)
        return
      }
      if (touches.length === 1) {
        // XR 事件的 pageX/Y 与 scene.width/height 同为渲染像素，不能再乘 DPR。
        // 沿用官方 (width + height) / 4 归一化；灵敏度统一在文件顶部调整。
        const radius = (this.scene.width + this.scene.height) / 4
        if (!(radius > 0)) return
        this.yawTransform.rotation.y += (touches[0].pageX - previous[0].pageX) / radius * ROTATE_SPEED
        this.modelTransform.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2,
          this.modelTransform.rotation.x + (touches[0].pageY - previous[0].pageY) / radius * ROTATE_SPEED))
      } else if (touches.length === 2) {
        const distance = points => Math.hypot(points[0].pageX - points[1].pageX, points[0].pageY - points[1].pageY)
        const before = distance(previous)
        const after = distance(touches)
        if (before > 0 && after > 0) {
          // 比例缩放避免官方示例按每次事件截断增量造成刷新率/DPR 影响速度。
          const scale = Math.max(0.4, Math.min(2.5, this.modelTransform.scale.x * after / before))
          this.modelTransform.scale.setValue(scale, scale, scale)
        }
      }
      this.startGesture(touches)
    },
    handleAssetsLoaded() {
      this.setData({ loaded: true })
      this.applyMaterial()
      this.triggerEvent('modelready')
    },
    handleError() { this.triggerEvent('modelerror') },
    applyMaterial() {
      if (!this.scene || !this.data.loaded) return
      const system = wx.getXrFrameSystem()
      const element = this.scene.getElementById('loaded-model')
      const gltf = element && element.getComponent(system.GLTF)
      if (!gltf || !gltf.meshes || !gltf.meshes.length) return
      if (!this.originals) this.originals = gltf.meshes.map(mesh => mesh.material)
      const clay = this.scene.assets.getAsset('material', 'preview-clay')
      gltf.meshes.forEach((mesh, index) => {
        mesh.setData({ material: this.data.clay ? clay : this.originals[index] })
      })
    },
    handleTick({ detail }) {
      if (!this.data.auto || !this.data.loaded || this.interacting || !this.yawTransform) return
      // 切后台或掉帧后不补转整段停顿时间，避免恢复时模型突然跳转。
      const delta = Math.min(Math.max(Number(detail.value) || 0, 0), 100)
      // 手动拖动只在 touchmove 中更新一次；tick 不重放手势，没有惯性尾转。
      this.yawTransform.rotation.y += delta * Math.PI / 25000 // 7.2°/s，与 H5 自动旋转一致。
    },
  },
})
