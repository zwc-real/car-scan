import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'

import type { ModelViewerProps } from '../types/model'

/** 原生 XR-Frame 负责 GLB 解码、轨道相机及 GPU 资源生命周期。 */
export function ModelViewer(props: ModelViewerProps) {
  const [size, setSize] = useState({ width: 1, height: 1 })
  useEffect(() => {
    Taro.nextTick(() => {
      Taro.createSelectorQuery().select('#native-glb-host').boundingClientRect(rect => {
        if (!rect || Array.isArray(rect)) return
        const ratio = Taro.getSystemInfoSync().pixelRatio || 1
        setSize({ width: Math.round(rect.width * ratio), height: Math.round(rect.height * ratio) })
      }).exec()
    })
  }, [])
  return <View id='native-glb-host' className='glb-viewer' onTouchStart={props.onInteract}>
    <glb-scene src={props.url} clay={props.clay} auto={props.auto}
      width={size.width} height={size.height} style='display:block;width:100%;height:100%'
      onModelready={props.onLoaded}
      onInteract={props.onInteract}
      onModelerror={() => props.onError('模型加载失败，请检查网络或使用支持 XR-Frame 的微信版本')}
    />
  </View>
}
