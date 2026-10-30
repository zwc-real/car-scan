import type { UserConfigExport } from '@tarojs/cli'

export default {
  defineConstants: {},
  mini: {},
  h5: {
    // Docker 必须监听所有网卡，否则宿主机的 10086 端口无法访问。
    devServer: {
      host: '0.0.0.0',
      port: 10086,
    },
  },
} satisfies UserConfigExport<'webpack5'>

