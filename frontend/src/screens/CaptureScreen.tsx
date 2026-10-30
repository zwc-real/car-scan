import { Button, Image, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo, useState } from 'react'

import { Icon } from '../components/Icon'
import { MiniCar } from '../components/MiniCar'
import { ViewGuide } from '../components/ViewGuide'
import { VIEWS } from '../constants/views'
import type { PhotoMap, ViewKey } from '../types/project'

export function CaptureScreen({
  onBack,
  onGenerate,
}: {
  onBack: () => void
  onGenerate: (name: string, photos: PhotoMap) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [photos, setPhotos] = useState<PhotoMap>({})
  const [activeView, setActiveView] = useState<ViewKey | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const count = useMemo(() => VIEWS.filter((view) => photos[view.key]).length, [photos])
  const nextView = VIEWS.find((view) => !photos[view.key])?.key
  const activeDefinition = VIEWS.find((view) => view.key === activeView)

  const selectPhoto = async (sourceType: 'camera' | 'album') => {
    if (!activeView) return
    try {
      const result = await Taro.chooseMedia({ count: 1, mediaType: ['image'], sourceType: [sourceType] })
      const path = result.tempFiles[0]?.tempFilePath
      if (path) setPhotos((current) => ({ ...current, [activeView]: path }))
      setActiveView(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!/cancel/i.test(message)) Taro.showToast({ title: '未能读取照片', icon: 'none' })
    }
  }

  const removePhoto = () => {
    if (!activeView) return
    setPhotos((current) => {
      const next = { ...current }
      delete next[activeView]
      return next
    })
    setActiveView(null)
  }

  const useDemoPhotos = () => {
    setPhotos(Object.fromEntries(VIEWS.map((view) => [view.key, `demo://${view.key}`])) as PhotoMap)
    Taro.showToast({ title: '已填入示例照片', icon: 'success' })
  }

  const submit = async () => {
    if (count < VIEWS.length || submitting) return
    setSubmitting(true)
    try {
      await onGenerate(name.trim(), photos)
    } catch {
      // 上层已展示具体错误，保留照片以便重试。
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='screen capture-screen'>
      <View className='capture-header safe-top'><Button className='back-button' onClick={onBack}><Icon name='back' /><Text>取消</Text></Button><Text className='capture-count'>{String(count).padStart(2, '0')}<Text className='muted'> / 10</Text></Text></View>
      <View className='capture-progress'>{VIEWS.map(view => <View key={view.key} className={`capture-progress__part ${photos[view.key] ? 'is-complete' : nextView === view.key ? 'is-next' : ''}`} />)}</View>
      <View className='screen-scroll capture-scroll'>
        <View className='capture-intro'><Text className='capture-title'>拍摄 10 个角度</Text><Text className='capture-instructions'>纯色桌面 / 光线均匀 / 车辆完整入镜{ '\n' }按示意图中红点的位置拍摄</Text>
          <View className='project-name-field'><Text className='field-label'>项目名称</Text><Input className='project-name-input' maxlength={40} value={name} placeholder='例如：红色跑车' onInput={event => setName(event.detail.value)} /></View>
        </View>
        <View className='view-grid'>{VIEWS.map((view,index) => {
          const photo = photos[view.key], next = view.key === nextView
          return <Button key={view.key} className={`view-card ${next ? 'view-card--next' : ''}`} onClick={() => setActiveView(view.key)}>
            <View className={`view-card__visual grid-paper ${photo ? 'has-photo' : ''}`}>
              {photo ? photo.startsWith('demo://') ? <View className='demo-photo'><MiniCar color={['#D6402A','#2D4FA8','#E0A526','#2E7D62','#6A4DB0'][index % 5]} /></View> : <Image className='view-card__photo' src={photo} mode='aspectFill' /> : <ViewGuide view={view} />}
              <View className='bracket bracket--tl' /><View className='bracket bracket--tr' /><View className='bracket bracket--bl' /><View className='bracket bracket--br' />
              {photo && <Text className='photo-status'>已拍摄</Text>}
            </View>
            <View className='view-card__body'><Text className='view-card__number'>{String(index+1).padStart(2,'0')}</Text><View><Text className='view-card__label'>{view.label}</Text><Text className='view-card__hint'>{next && !photo ? '▸ 下一张' : view.code}</Text></View></View>
          </Button>
        })}</View>
        <Button className='demo-button' onClick={useDemoPhotos}>没有玩具车？填入示例照片</Button>
      </View>
      <View className='bottom-action'><Button className='primary-button' disabled={count < 10 || submitting} loading={submitting} onClick={submit}><Text>{count < 10 ? '继续拍摄' : '生成 3D 模型'}</Text><Text className='button-meta'>{count < 10 ? `还差 ${10-count} 张` : '→'}</Text></Button></View>
      {activeDefinition && <View className='sheet-mask' onClick={() => setActiveView(null)}><View className='photo-sheet' onClick={event => event.stopPropagation()}>
        <View className='photo-sheet__heading'><View className='photo-sheet__guide grid-paper'><ViewGuide view={activeDefinition} /></View><View><Text className='field-label'>{String(VIEWS.indexOf(activeDefinition)+1).padStart(2,'0')} / {activeDefinition.code}</Text><Text className='photo-sheet__title'>{activeDefinition.label}</Text><Text className='photo-sheet__hint'>{activeDefinition.hint}</Text></View></View>
        <Button className='sheet-action' onClick={() => selectPhoto('camera')}><Icon name='camera' />拍照</Button>
        <Button className='sheet-action' onClick={() => selectPhoto('album')}><Icon name='image' />从相册选择</Button>
        {photos[activeDefinition.key] && <Button className='sheet-action sheet-delete' onClick={removePhoto}><Icon name='trash' />删除这张照片</Button>}
        <Button className='sheet-cancel' onClick={() => setActiveView(null)}>取消</Button>
      </View></View>}
    </View>
  )
}
