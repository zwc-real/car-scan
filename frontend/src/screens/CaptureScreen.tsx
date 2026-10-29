import { Button, Image, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo, useState } from 'react'

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
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='screen capture-screen'>
      <View className='capture-header safe-top'>
        <Button className='circle-button' aria-label='返回项目列表' onClick={onBack}>←</Button>
        <Text className='capture-header__title'>拍摄多视角照片</Text>
        <Text className='capture-count'>{count}<Text className='muted'> / 10</Text></Text>
      </View>

      <View className='screen-scroll capture-scroll'>
        <View className='capture-progress'>
          {VIEWS.map((view) => <View key={view.key} className={`capture-progress__part ${photos[view.key] ? 'is-complete' : ''}`} />)}
        </View>

        <Input
          className='project-name-input'
          maxlength={40}
          value={name}
          placeholder='给你的玩具车起个名字（可选）'
          onInput={(event) => setName(event.detail.value)}
        />

        <View className='capture-tip'>
          <Text className='capture-tip__spark'>✦</Text>
          <Text>将玩具车放在纯色桌面、光线均匀处。每张照片让车辆完整入镜，按图中橙色相机的位置拍摄。</Text>
        </View>

        <View className='view-grid'>
          {VIEWS.map((view, index) => {
            const photo = photos[view.key]
            return (
              <Button
                key={view.key}
                className={`view-card ${nextView === view.key ? 'view-card--next' : ''}`}
                onClick={() => setActiveView(view.key)}
              >
                <View className='view-card__visual'>
                  {photo && !photo.startsWith('demo://') ? (
                    <Image className='view-card__photo' src={photo} mode='aspectFill' />
                  ) : (
                    <ViewGuide view={view} />
                  )}
                  <Text className='view-card__number'>{index + 1}</Text>
                  {photo ? <Text className='view-card__check'>✓</Text> : null}
                </View>
                <View className='view-card__body'>
                  <View>
                    <Text className='view-card__label'>{view.label}</Text>
                    <Text className='view-card__hint'>{photo ? '点击重拍或更换' : view.hint}</Text>
                  </View>
                  {!photo ? <Text className='view-card__add'>＋</Text> : null}
                </View>
              </Button>
            )
          })}
        </View>

        <Button className='demo-button' onClick={useDemoPhotos}>没有玩具车？使用示例照片体验</Button>
      </View>

      <View className='bottom-action safe-bottom'>
        <Button className='primary-button' disabled={count < 10 || submitting} loading={submitting} onClick={submit}>
          {count < 10 ? `还需拍摄 ${10 - count} 张` : '◇ 生成 3D 模型'}
        </Button>
      </View>

      {activeDefinition ? (
        <View className='sheet-mask' onClick={() => setActiveView(null)}>
          <View className='photo-sheet safe-bottom' onClick={(event) => event.stopPropagation()}>
            <View className='photo-sheet__handle' />
            <View className='photo-sheet__heading'>
              <View className='photo-sheet__guide'><ViewGuide view={activeDefinition} /></View>
              <View>
                <Text className='photo-sheet__title'>{activeDefinition.label}</Text>
                <Text className='photo-sheet__hint'>{activeDefinition.hint}</Text>
              </View>
            </View>
            <Button className='sheet-action sheet-action--dark' onClick={() => selectPhoto('camera')}>⌁ 拍照</Button>
            <Button className='sheet-action' onClick={() => selectPhoto('album')}>▧ 从相册选择</Button>
            {photos[activeDefinition.key] ? <Button className='sheet-delete' onClick={removePhoto}>删除这张照片</Button> : null}
            <Button className='sheet-cancel' onClick={() => setActiveView(null)}>取消</Button>
          </View>
        </View>
      ) : null}
    </View>
  )
}

