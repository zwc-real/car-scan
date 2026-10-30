import { View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useCallback, useState } from 'react'

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

export default function IndexPage() {
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
    <View className='app-shell'>
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

