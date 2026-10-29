import { View } from '@tarojs/components'

import type { ViewDefinition } from '../constants/views'

export function ViewGuide({ view }: { view: ViewDefinition }) {
  return (
    <View className={`view-guide ${view.vertical ? 'view-guide--vertical' : ''}`}>
      <View className='view-guide__ring' />
      <View className='view-guide__car'>
        <View className='view-guide__glass view-guide__glass--front' />
        <View className='view-guide__glass view-guide__glass--back' />
        <View className='view-guide__nose' />
        <View className='view-guide__wheel view-guide__wheel--a' />
        <View className='view-guide__wheel view-guide__wheel--b' />
        <View className='view-guide__wheel view-guide__wheel--c' />
        <View className='view-guide__wheel view-guide__wheel--d' />
      </View>
      <View className='view-guide__dot' style={{ left: `${view.dotX}%`, top: `${view.dotY}%` }}>
        <View className='view-guide__dot-core' />
      </View>
    </View>
  )
}

