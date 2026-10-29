import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'

import { MiniCar } from '../components/MiniCar'
import { errorMessage, regenerateProject, requestModelExport } from '../services/api'
import type { Project } from '../types/project'

function formatFaces(value: number): string {
  return value >= 10000 ? `${(value / 10000).toFixed(1)} 万` : String(value)
}

function readTouchX(event: unknown): number | null {
  // Taro's cross-platform base event omits the native touches field from its type.
  const touchEvent = event as { touches?: Array<{ clientX?: number }> }
  return touchEvent.touches?.[0]?.clientX ?? null
}

export function PreviewScreen({
  project,
  onBack,
  onRegenerated,
}: {
  project: Project
  onBack: () => void
  onRegenerated: (project: Project) => void
}) {
  const [clay, setClay] = useState(false)
  const [auto, setAuto] = useState(true)
  const [rotation, setRotation] = useState(-10)
  const touchX = useRef<number | null>(null)

  useEffect(() => {
    if (!auto) return undefined
    const timer = setInterval(() => setRotation((value) => (value + 2) % 360), 80)
    return () => clearInterval(timer)
  }, [auto])

  const exportModel = async () => {
    try {
      const message = await requestModelExport(project.id)
      Taro.showToast({ title: message, icon: 'none', duration: 2200 })
    } catch (error) {
      Taro.showToast({ title: errorMessage(error), icon: 'none' })
    }
  }

  const regenerate = async () => {
    try {
      const next = await regenerateProject(project.id)
      onRegenerated(next)
    } catch (error) {
      Taro.showToast({ title: errorMessage(error), icon: 'none' })
    }
  }

  return (
    <View className='screen preview-screen'>
      <View
        className='model-stage'
        onTouchStart={(event) => {
          touchX.current = readTouchX(event)
          setAuto(false)
        }}
        onTouchMove={(event) => {
          const x = readTouchX(event)
          if (x == null || touchX.current == null) return
          setRotation((value) => value + (x - touchX.current!) * 0.5)
          touchX.current = x
        }}
        onTouchEnd={() => { touchX.current = null }}
      >
        <View className='preview-header safe-top'>
          <Button className='glass-button' aria-label='返回' onClick={onBack}>←</Button>
          <Button className='glass-button' aria-label='分享' openType='share'>↗</Button>
        </View>
        <View className='model-stage__car'>
          <MiniCar color={project.color} clay={clay} large rotation={rotation} />
        </View>
        <Text className='rotate-hint'>☝ 拖动旋转查看</Text>
        <Button className={`auto-rotate ${auto ? 'auto-rotate--active' : ''}`} onClick={() => setAuto((value) => !value)}>↻</Button>
      </View>

      <View className='model-panel safe-bottom'>
        <View className='model-panel__heading'>
          <View className='model-panel__copy'>
            <Text className='model-name'>{project.name}</Text>
            <Text className='model-subtitle'>基于 {project.photoCount} 张照片</Text>
          </View>
          <View className='mode-switch'>
            <Button className={`mode-switch__item ${!clay ? 'is-active' : ''}`} onClick={() => setClay(false)}>纹理</Button>
            <Button className={`mode-switch__item ${clay ? 'is-active' : ''}`} onClick={() => setClay(true)}>白模</Button>
          </View>
        </View>

        <View className='model-stats'>
          <View className='model-stat'><Text className='model-stat__key'>面数</Text><Text className='model-stat__value'>{formatFaces(project.faces)}</Text></View>
          <View className='model-stat'><Text className='model-stat__key'>贴图</Text><Text className='model-stat__value'>2048²</Text></View>
          <View className='model-stat'><Text className='model-stat__key'>大小</Text><Text className='model-stat__value'>14.2 MB</Text></View>
        </View>

        <View className='model-actions'>
          <Button className='model-action model-action--primary' onClick={exportModel}>⇩ 导出模型</Button>
          <Button className='model-action' onClick={regenerate}>↻ 重新生成</Button>
        </View>
      </View>
    </View>
  )
}

