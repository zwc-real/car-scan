const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { runInNewContext } = require('node:vm')

// 回放真实组件的场景事件，验证位移、DPR、帧数与转角的关系，而非仅检查配置。
function createPreview(dpr = 1) {
  let definition
  const transform = () => ({ rotation: { x: 0, y: 0, z: 0 }, scale: {
    x: 1, y: 1, z: 1, setValue(x, y, z) { Object.assign(this, { x, y, z }) },
  } })
  const model = transform()
  const yaw = transform()
  const listeners = new Map()
  const events = []
  const scene = {
    width: 430 * dpr, height: 700 * dpr,
    getElementById(id) { return { getComponent() { return id === 'preview-model' ? model : yaw } } },
    event: {
      add(name, callback) { assert.ok(!listeners.has(name), '不能重复注册监听'); listeners.set(name, callback) },
      remove(name, callback) { if (listeners.get(name) === callback) listeners.delete(name) },
    },
  }
  const wx = { getXrFrameSystem() { return { Transform: {} } } }
  if (process.argv.includes('--dist')) {
    // 同一组回放也运行在实际打包产物上，避免只测源码、IDE 仍加载旧逻辑。
    wx.webpackJsonp = { push([, modules, entry]) {
      const cache = {}
      function load(id) {
        if (!cache[id]) {
          cache[id] = { exports: {} }
          modules[id](cache[id], cache[id].exports, load)
        }
        return cache[id].exports
      }
      entry(load)
    } }
  }
  const target = process.argv.includes('--dist') ? '../dist/native/glb-scene/index.js' : '../src/native/glb-scene/index.js'
  runInNewContext(readFileSync(resolve(__dirname, target), 'utf8'), { Component(value) { definition = value }, wx })
  const component = {
    ...definition.methods, data: { ...definition.data, width: scene.width, height: scene.height, auto: true, loaded: true },
    setData(value) { Object.assign(this.data, value) }, triggerEvent(name) { events.push(name) },
  }
  component.handleReady({ detail: { value: scene } })
  return {
    model, yaw, events, listeners, component, definition,
    touch(x, y, identifier = 0) { return { identifier, pageX: x * dpr, pageY: y * dpr } },
    emit(name, touches = []) { listeners.get(name)({ touches }) },
    ticks(count) { for (let i = 0; i < count; i++) component.handleTick({ detail: { value: 1000 / 60 } }) },
  }
}
const near = (a, b, label) => assert.ok(Math.abs(a - b) < 1e-10, `${label}: ${a} != ${b}`)
const angles = []
for (const dpr of [1, 2, 3]) {
  for (const steps of [1, 10, 100]) {
    const p = createPreview(dpr)
    p.emit('touchstart', [p.touch(100, 200)])
    for (let i = 1; i <= steps; i++) {
      p.emit('touchmove', [p.touch(100 + 100 * i / steps, 200)])
      p.ticks(2)
    }
    near(p.yaw.rotation.y, 100 / ((430 + 700) / 4) * 5, '官方 demo 灵敏度 5 下，100px 拖动的总转角')
    const stopped = p.yaw.rotation.y
    p.ticks(120)
    near(p.yaw.rotation.y, stopped, '手指按住不动不得继续旋转')
    p.emit('touchend')
    p.ticks(120)
    near(p.yaw.rotation.y, stopped, '松手后不得继续旋转')
    p.emit('touchstart', [p.touch(200, 200)])
    p.emit('touchmove', [p.touch(100, 200)])
    near(p.yaw.rotation.y, 0, '等距离反向拖动回到原角度')
    angles.push(stopped)
  }
}
const p = createPreview(3)
p.emit('touchstart', [p.touch(100, 200)])
p.emit('touchmove', [p.touch(100, 220)])
assert.ok(p.model.rotation.x > 0, '向下拖动应增加俯仰角')
const yaw = p.yaw.rotation.y
p.emit('touchmove', [p.touch(50, 200), p.touch(150, 200, 1)])
near(p.yaw.rotation.y, yaw, '单指切双指不能跳转')
p.emit('touchmove', [p.touch(25, 200), p.touch(175, 200, 1)])
near(p.model.scale.x, 1.5, '双指拉开 1.5 倍，模型缩放 1.5 倍')
p.emit('touchend', [p.touch(25, 200)])
p.emit('touchmove', [p.touch(300, 200)])
near(p.yaw.rotation.y, yaw, '双指释放一指后不能突然变为旋转')
p.emit('touchstart', [p.touch(300, 200)])
p.emit('touchcancel')
p.emit('touchmove', [p.touch(400, 200)])
near(p.yaw.rotation.y, yaw, '取消触摸后忽略移动')
assert.ok(p.events.includes('interact'), '原生触摸必须通知 React 停止自动旋转')
p.component.data.auto = true
p.definition.properties.auto.observer.call(p.component, true)
p.ticks(60)
near(p.yaw.rotation.y - yaw, Math.PI / 25, '手动重新开启自动旋转：每秒 7.2°')
p.definition.lifetimes.detached.call(p.component)
assert.equal(p.listeners.size, 0, '离开预览时释放全部监听')
console.log(`微信手势回放通过：DPR 1/2/3 × 1/10/100 次事件，100px 均旋转 ${(angles[0] * 180 / Math.PI).toFixed(2)}°；静止/松手无尾转，反向回位、单双指切换、缩放、取消、自动旋转及清理通过。`)
