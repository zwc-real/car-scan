const { existsSync, readFileSync } = require('node:fs')
const { resolve, dirname } = require('node:path')

// Taro 编译成功不代表微信渲染上下文可生成；沿注册关系检查原生组件产物。
const root = resolve(__dirname, '../dist')
const app = JSON.parse(readFileSync(resolve(root, 'app.json'), 'utf8'))
const queue = [resolve(root, 'app'), ...app.pages.map(page => resolve(root, page))]
for (const pack of app.subPackages || app.subpackages || []) {
  queue.push(...pack.pages.map(page => resolve(root, pack.root, page)))
}
const visited = new Set()
const errors = []
let xrCount = 0
while (queue.length) {
  const component = queue.shift()
  if (visited.has(component)) continue
  visited.add(component)
  const filename = `${component}.json`
  if (!existsSync(filename)) { errors.push(`组件配置缺失：${filename}`); continue }
  const config = JSON.parse(readFileSync(filename, 'utf8'))
  if (config.renderer === 'xr-frame') {
    xrCount++
    for (const extension of ['js', 'json', 'wxml', 'wxss']) {
      if (!existsSync(`${component}.${extension}`)) errors.push(`XR-Frame 组件缺少 ${component}.${extension}`)
    }
    if (app.lazyCodeLoading !== 'requiredComponents') errors.push('XR-Frame 必须配置 lazyCodeLoading: requiredComponents')
  }
  for (const target of Object.values(config.usingComponents || {})) {
    if (target.includes('://')) continue
    queue.push(target.startsWith('/') ? resolve(root, target.slice(1)) : resolve(dirname(component), target))
  }
}
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`微信原生组件检查通过：${xrCount} 个 XR-Frame 组件文件齐全，按需加载配置正确。`)
