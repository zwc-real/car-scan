export default definePageConfig({
  navigationStyle: 'custom',
  disableScroll: true,
  backgroundColor: '#F5F2EC',
  enableShareAppMessage: true,
  usingComponents: process.env.TARO_ENV === 'weapp' ? {
    'glb-scene': '../../native/glb-scene/index',
  } : {},
})

