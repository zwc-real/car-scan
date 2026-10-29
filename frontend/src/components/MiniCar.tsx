import { View } from '@tarojs/components'

interface MiniCarProps {
  color: string
  large?: boolean
  rotation?: number
  clay?: boolean
}

/** 纯 CSS 车辆插画，避免小程序端对内联 SVG 的兼容差异。 */
export function MiniCar({ color, large = false, rotation = 0, clay = false }: MiniCarProps) {
  const bodyColor = clay ? '#DAD6CC' : color
  return (
    <View className={`mini-car ${large ? 'mini-car--large' : ''}`} style={{ transform: `rotate(${rotation}deg)` }}>
      <View className='mini-car__shadow' />
      <View className='mini-car__body' style={{ backgroundColor: bodyColor }} />
      <View className='mini-car__roof' style={{ backgroundColor: clay ? '#BDB9AF' : '#2A3A52' }} />
      <View className='mini-car__light' />
      <View className='mini-car__wheel mini-car__wheel--left'>
        <View className='mini-car__hub' />
      </View>
      <View className='mini-car__wheel mini-car__wheel--right'>
        <View className='mini-car__hub' />
      </View>
    </View>
  )
}

