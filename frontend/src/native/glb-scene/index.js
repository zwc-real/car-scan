// 仅用于微信端的原生组件；模型通过网络加载，不进入小程序包体。
Component({
  properties: {
    src: String,
    clay: { type: Boolean, observer() { this.applyMaterial() } },
    auto: { type: Boolean, value: true },
    width: { type: Number, observer() { this.fitCamera() } },
    height: { type: Number, observer() { this.fitCamera() } },
  },
  data: { loaded: false, angle: 0, cameraPosition: '3.4 1.8 4.5' },
  lifetimes: {
    detached() { this.scene = null; this.originals = null },
  },
  methods: {
    fitCamera() {
      if (!this.data.width || !this.data.height) return
      const halfFov = Math.atan(Math.tan(Math.PI / 9) * Math.min(1, this.data.width / this.data.height))
      const distance = 1.38 / Math.sin(halfFov) * 1.08
      this.setData({ cameraPosition: `${distance * .58} ${distance * .3} ${distance * .756}` })
    },
    handleReady({ detail }) { this.scene = detail.value },
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
      if (!this.data.auto || !this.data.loaded) return
      // tick 的 deltaTime 以毫秒计；限制 setData 频率，避免跨层每帧通信。
      this.elapsed = (this.elapsed || 0) + detail.value
      if (this.elapsed < 33) return
      const angle = (this.data.angle + this.elapsed * 0.018) % 360
      this.elapsed = 0
      this.setData({ angle })
    },
  },
})
