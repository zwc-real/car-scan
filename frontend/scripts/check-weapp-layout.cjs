const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')

// 检查真实构建产物，捕获配置正确但 px→rpx 转换/平台选择错误的回归。
const css = readFileSync(resolve(__dirname, '../dist/pages/index/index.wxss'), 'utf8')
function declarations(selector) {
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selectors.split(',').map(item => item.trim()).includes(selector)) continue
    return Object.fromEntries(body.split(';').filter(Boolean).map(item => {
      const separator = item.indexOf(':')
      return [item.slice(0, separator).trim(), item.slice(separator + 1).trim()]
    }))
  }
  throw new Error(`缺少构建样式 ${selector}`)
}

const shell = declarations('.app-shell')
assert.equal(shell.width, '100%')
assert.equal(shell['max-width'], undefined, '小程序共享容器不能有桌面限宽')
assert.equal(declarations('.app-shell--weapp')['max-width'], 'none')
assert.equal(declarations('.app-shell--weapp .safe-top')['padding-top'], 'var(--app-safe-top)')
assert.match(declarations('.app-shell--weapp .bottom-action').padding, /var\(--app-safe-bottom\)/)
assert.doesNotMatch(css, /@media[^{}]+\{\.app-shell\{/, '桌面媒体查询必须限定为 H5')
assert.doesNotMatch(css, /app-shell--h5/, '小程序产物不应包含 H5 桌面画布规则')

for (const [selector, property, designValue] of [
  ['.app-shell .page-title', 'font-size', 34],
  ['.app-shell .project-thumb', 'width', 76],
  ['.app-shell .primary-button', 'height', 52],
]) {
  const value = declarations(selector)[property]
  assert.match(value, /^\d+(\.\d+)?rpx$/)
  assert.ok(Math.abs(parseFloat(value) - designValue * 750 / 430) < .0001,
    `${selector} 的 ${value} 不符合 430px 设计稿比例`)
}
console.log('微信布局检查通过：全屏宽度、430→750 尺寸换算、导航/底部安全区、H5 媒体查询隔离。')
