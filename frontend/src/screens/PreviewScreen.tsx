import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'

import { CarScene } from '../components/CarScene'
import { Icon } from '../components/Icon'
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

// H5 与小程序都提供 touches，Taro 的通用 View 类型未声明它。
function readTouches(event: unknown): Array<{ clientX: number; clientY: number }> {
  return (event as { touches?: Array<{ clientX: number; clientY: number }> }).touches || []
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
  const [rotation, setRotation] = useState(-35)
  const touchX = useRef<number | null>(null)
  const touchY = useRef<number | null>(null)
  const pinch = useRef<number | null>(null)
  const [pitch, setPitch] = useState(-18)
  const [scale, setScale] = useState(1.6)
  const [hint, setHint] = useState(true)
  const distance = (touches: Array<{ clientX: number; clientY: number }>) => touches.length < 2 ? null : Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)

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
      <View className='model-stage grid-paper'
        onTouchStart={event => {
          const touches = readTouches(event)
          touchX.current = readTouchX(event); touchY.current = touches[0]?.clientY ?? null
          pinch.current = distance(touches); setAuto(false); setHint(false)
        }}
        onTouchMove={event => {
          const touches = readTouches(event), d = distance(touches)
          if (d !== null && pinch.current !== null) { setScale(v => Math.max(.7,Math.min(2.5,v * d / pinch.current!))); pinch.current = d; return }
          const x = readTouchX(event), y = touches[0]?.clientY
          if (x !== null && touchX.current !== null) setRotation(v => v + (x-touchX.current!) * .6)
          if (y !== undefined && touchY.current !== null) setPitch(v => Math.max(-85,Math.min(5,v + (y-touchY.current!) * .3)))
          touchX.current = x; touchY.current = y ?? null
        }}
        onTouchEnd={() => { touchX.current = null; touchY.current = null; pinch.current = null }}
        onTouchCancel={() => { touchX.current = null; touchY.current = null; pinch.current = null }}
      >
        <CarScene color={project.color} clay={clay} yaw={rotation} pitch={pitch} scale={scale} />
        <View className='preview-header safe-top'><Button className='back-button' onClick={onBack}><Icon name='back' />项目</Button><Button className='share-button' aria-label='分享' openType='share'><Icon name='share' /></Button></View>
        <Text className='rotate-hint'>{hint ? '拖动旋转 / 双指缩放' : clay ? 'CLAY' : 'TEXTURED'}</Text>
        <Button className={`auto-rotate ${auto ? 'is-active' : ''}`} onClick={() => setAuto(v => !v)}><Icon name='rotate' inverse={auto} />自动旋转</Button>
      </View>
      <View className='model-panel'>
        <View className='model-panel__heading'><View className='model-panel__copy'><Text className='model-subtitle'>{new Date(project.createdAt).toLocaleDateString('zh-CN')}</Text><Text className='model-name'>{project.name}</Text></View>
          <View className='mode-switch'><Button className={`mode-switch__item ${!clay ? 'is-active' : ''}`} onClick={() => setClay(false)}>纹理</Button><Button className={`mode-switch__item ${clay ? 'is-active' : ''}`} onClick={() => setClay(true)}>白模</Button></View>
        </View>
        <View className='model-stats'>{[['面数',formatFaces(project.faces)+'面'],['贴图','2048²'],['文件','14.2 MB']].map(([key,value]) => <View className='model-stat' key={key}><Text className='model-stat__key'>{key}</Text><Text className='model-stat__value'>{value}</Text></View>)}</View>
        <View className='model-actions'><Button className='primary-button' onClick={exportModel}><Text>导出模型</Text><Icon name='download' inverse /></Button><Button className='regenerate-button' aria-label='重新生成' onClick={regenerate}><Icon name='refresh' /></Button></View>
      </View>
    </View>
  )
}
