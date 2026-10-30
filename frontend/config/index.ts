import { defineConfig, type UserConfigExport } from '@tarojs/cli'

import devConfig from './dev'
import prodConfig from './prod'

const DESIGN_WIDTH = 430
const DESIGN_RATIO = 750 / DESIGN_WIDTH

export default defineConfig<'webpack5'>(async (merge, { command, mode }) => {
  const baseConfig: UserConfigExport<'webpack5'> = {
    projectName: 'toy-scan-miniapp',
    date: '2026-10-29',
    designWidth: DESIGN_WIDTH,
    deviceRatio: {
      375: 2 / 1,
      // 小程序全屏为 750rpx；430px 设计稿的每个 px 应换算为 750/430 rpx。
      [DESIGN_WIDTH]: DESIGN_RATIO,
      750: 1,
    },
    sourceRoot: 'src',
    // H5 dev server 启动会清理输出目录，不能与微信开发者工具共用 dist。
    outputRoot: process.env.TARO_ENV === 'h5' ? 'dist-h5' : 'dist',
    framework: 'react',
    compiler: 'webpack5',
    cache: { enable: false },
    env: {
      TARO_APP_API_BASE_URL: JSON.stringify(process.env.TARO_APP_API_BASE_URL || 'https://testing.microcleartech.com/api'),
    },
    mini: {
      postcss: {
        pxtransform: { enable: true, config: {} },
        url: { enable: true, config: { limit: 1024 } },
        cssModules: { enable: false, config: { namingPattern: 'module', generateScopedName: '[name]__[local]___[hash:base64:5]' } },
      },
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      postcss: {
        pxtransform: {
          enable: true,
          // 根字号与 rem 换算一起按比例调整，保留 H5 原有的逻辑像素尺寸。
          config: { baseFontSize: 20, minRootSize: 20 / DESIGN_RATIO, maxRootSize: 40 / DESIGN_RATIO },
        },
        autoprefixer: { enable: true, config: {} },
        cssModules: { enable: false, config: { namingPattern: 'module', generateScopedName: '[name]__[local]___[hash:base64:5]' } },
      },
    },
  }

  return merge({}, baseConfig, command === 'build' ? prodConfig : devConfig)
})

