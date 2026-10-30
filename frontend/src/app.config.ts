export default defineAppConfig({
  pages: ['pages/index/index'],
  // XR-Frame 是独立渲染器，按需加载以免首页初始化时提前创建其上下文。
  lazyCodeLoading: 'requiredComponents',
  window: {
    navigationStyle: 'custom',
    backgroundTextStyle: 'dark',
    backgroundColor: '#F5F2EC',
  },
})

