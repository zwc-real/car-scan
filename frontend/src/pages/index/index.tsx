import { View } from '@tarojs/components'
import Taro, { useDidShow, useResize } from '@tarojs/taro'
import { useCallback, useState, type CSSProperties } from 'react'

import { VIEWS } from '../../constants/views'
import { CaptureScreen } from '../../screens/CaptureScreen'
import { GeneratingScreen } from '../../screens/GeneratingScreen'
import { PreviewScreen } from '../../screens/PreviewScreen'
import { ProjectsScreen } from '../../screens/ProjectsScreen'
import {
  createProject,
  errorMessage,
  fetchProjects,
  startGeneration,
  uploadProjectPhoto,
} from '../../services/api'
import type { PhotoMap, Project } from '../../types/project'
import './index.scss'

type Screen = 'projects' | 'capture' | 'generating' | 'preview'

function readViewportStyle(): CSSProperties {
  if (process.env.TARO_ENV !== 'weapp') return {}
  const info = Taro.getWindowInfo()
  const statusBarHeight = info.statusBarHeight || 0
  let top = statusBarHeight + 44
  try {
    const capsule = Taro.getMenuButtonBoundingClientRect()
    if (capsule.bottom > 0) top = Math.max(top, capsule.bottom + 8)
  } catch {
    // 无胶囊数据的模拟器使用状态栏 + 标准导航高度。
  }
  const bottom = Math.max(0, info.screenHeight - (info.safeArea?.bottom ?? info.screenHeight))
  // API 返回物理逻辑 px；使用行内样式，不再次经过设计稿的 px→rpx 转换。
  return {
    height: `${info.windowHeight}px`,
    '--app-safe-top': `${top}px`,
    '--app-safe-bottom': `${Math.max(bottom, 16 * info.windowWidth / 430)}px`,
  } as CSSProperties
}

export default function IndexPage() {
  const [viewportStyle, setViewportStyle] = useState(readViewportStyle)
  useResize(() => setViewportStyle(readViewportStyle()))
  const [screen, setScreen] = useState<Screen>('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      setProjects(await fetchProjects())
    } catch (error) {
      Taro.showToast({ title: errorMessage(error), icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    if (screen === 'projects') loadProjects()
  })

  const backToProjects = () => {
    setScreen('projects')
    setSelected(null)
    loadProjects()
  }

  const openProject = (project: Project) => {
    setSelected(project)
    setScreen(project.status === 'done' ? 'preview' : 'generating')
  }

  const generate = async (name: string, photos: PhotoMap) => {
    try {
      const sample = VIEWS.some((view) => photos[view.key]?.startsWith('demo://'))
      let project = await createProject(name, sample)
      for (const view of VIEWS) {
        const path = photos[view.key]
        if (!path) throw new Error(`缺少“${view.label}”照片`)
        // 示例照片由后端填充，用户替换的真实照片仍照常上传。
        if (path.startsWith('demo://')) continue
        await uploadProjectPhoto(project.id, view.key, path)
      }
      project = await startGeneration(project.id)
      setProjects((current) => [project, ...current])
      setSelected(project)
      setScreen('generating')
    } catch (error) {
      Taro.showToast({ title: errorMessage(error), icon: 'none', duration: 2500 })
      throw error
    }
  }

  return (
    <View className={`app-shell app-shell--${process.env.TARO_ENV}`} style={viewportStyle}>
      {screen === 'projects' ? (
        <ProjectsScreen projects={projects} loading={loading} onNew={() => setScreen('capture')} onOpen={openProject} onRetry={loadProjects} />
      ) : null}
      {screen === 'capture' ? <CaptureScreen onBack={backToProjects} onGenerate={generate} /> : null}
      {screen === 'generating' && selected ? (
        <GeneratingScreen
          project={selected}
          onChange={setSelected}
          onDone={(project) => { setSelected(project); setScreen('preview') }}
          onBack={backToProjects}
        />
      ) : null}
      {screen === 'preview' && selected ? (
        <PreviewScreen
          project={selected}
          onBack={backToProjects}
          onRegenerated={(project) => { setSelected(project); setScreen('generating') }}
        />
      ) : null}
    </View>
  )
}

