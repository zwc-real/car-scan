import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'

import { ModelViewer } from '../components/ModelViewer'
import { Icon } from '../components/Icon'
import { errorMessage, fetchPreviewModel, regenerateProject, requestModelExport } from '../services/api'
import type { PreviewModel } from '../types/model'
import type { Project } from '../types/project'

export function PreviewScreen({ project, onBack, onRegenerated }: {
  project: Project
  onBack: () => void
  onRegenerated: (project: Project) => void
}) {
  const [clay, setClay] = useState(false)
  const [auto, setAuto] = useState(true)
  const [hint, setHint] = useState(true)
  const [model, setModel] = useState<PreviewModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let disposed = false
    setLoading(true)
    setError('')
    setModel(null)
    fetchPreviewModel().then(value => {
      if (!disposed) setModel(value)
    }).catch(reason => {
      if (!disposed) { setLoading(false); setError(errorMessage(reason)) }
    })
    return () => { disposed = true }
  }, [attempt])

  const exportModel = async () => {
    try {
      Taro.showToast({ title: await requestModelExport(project.id), icon: 'none', duration: 2200 })
    } catch (reason) { Taro.showToast({ title: errorMessage(reason), icon: 'none' }) }
  }
  const regenerate = async () => {
    try { onRegenerated(await regenerateProject(project.id)) }
    catch (reason) { Taro.showToast({ title: errorMessage(reason), icon: 'none' }) }
  }

  return <View className='screen preview-screen'>
    <View className='model-stage grid-paper'>
      {model && !error && <ModelViewer key={attempt} url={model.url} clay={clay} auto={auto}
        onInteract={() => { setAuto(false); setHint(false) }}
        onLoaded={() => setLoading(false)}
        onError={message => { setError(message); setLoading(false) }}
      />}
      {(loading || error) && <View className='model-load-state'>
        <Text>{error || '正在加载测试模型…'}</Text>
        {loading && model && <Text className='model-load-detail'>{(model.bytes / 1048576).toFixed(1)} MiB · 首次加载请稍候</Text>}
        {error && <Button className='text-button' onClick={() => setAttempt(value => value + 1)}>重新加载</Button>}
      </View>}
      <View className='preview-header safe-top'>
        <Button className='back-button' onClick={onBack}><Icon name='back' />项目</Button>
        <Button className='share-button' aria-label='分享' openType='share'><Icon name='share' /></Button>
      </View>
      <Text className='rotate-hint'>{hint ? '拖动旋转 / 双指或滚轮缩放' : clay ? 'CLAY' : 'TEXTURED'}</Text>
      <Button className={`auto-rotate ${auto ? 'is-active' : ''}`} onClick={() => setAuto(value => !value)}><Icon name='rotate' inverse={auto} />自动旋转</Button>
    </View>
    <View className='model-panel'>
      <View className='model-panel__heading'>
        <View className='model-panel__copy'><Text className='model-subtitle'>{new Date(project.createdAt).toLocaleDateString('zh-CN')} · 测试占位模型</Text><Text className='model-name'>{project.name}</Text></View>
        <View className='mode-switch'><Button className={`mode-switch__item ${!clay ? 'is-active' : ''}`} onClick={() => setClay(false)}>纹理</Button><Button className={`mode-switch__item ${clay ? 'is-active' : ''}`} onClick={() => setClay(true)}>白模</Button></View>
      </View>
      <View className='model-stats'>{[
        ['面数', model ? `${(model.faces / 10000).toFixed(1)} 万面` : '—'],
        ['贴图', model ? `${model.textures} 张 PBR` : '—'],
        ['文件', model ? `${(model.bytes / 1048576).toFixed(1)} MiB` : '—'],
      ].map(([key, value]) => <View className='model-stat' key={key}><Text className='model-stat__key'>{key}</Text><Text className='model-stat__value'>{value}</Text></View>)}</View>
      <View className='model-actions'><Button className='primary-button' onClick={exportModel}><Text>导出模型</Text><Icon name='download' inverse /></Button><Button className='regenerate-button' aria-label='重新生成' onClick={regenerate}><Icon name='refresh' /></Button></View>
    </View>
  </View>
}
