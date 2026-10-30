import { Button, Text, View } from '@tarojs/components'
import { useEffect } from 'react'

import { Icon } from '../components/Icon'
import { fetchProject } from '../services/api'
import type { Project } from '../types/project'

const STEPS = [
  { at: 0, end: 20, label: '上传照片' },
  { at: 20, end: 45, label: '对齐 10 个视角' },
  { at: 45, end: 75, label: '重建三维网格' },
  { at: 75, end: 100, label: '生成贴图材质' },
]

export function GeneratingScreen({
  project,
  onChange,
  onDone,
  onBack,
}: {
  project: Project
  onChange: (project: Project) => void
  onDone: (project: Project) => void
  onBack: () => void
}) {
  useEffect(() => {
    let disposed = false
    const refresh = async () => {
      try {
        const next = await fetchProject(project.id)
        if (disposed) return
        onChange(next)
        if (next.status === 'done') onDone(next)
      } catch {
        // 临时网络失败不打断页面，下一次轮询会继续尝试。
      }
    }
    const timer = setInterval(refresh, 1000)
    refresh()
    return () => { disposed = true; clearInterval(timer) }
  }, [project.id])
  const progress = Math.min(100, Math.round(project.progress))
  return (
    <View className='screen generating-screen safe-top safe-bottom'>
      <Button className='back-button' onClick={onBack}><Icon name='back' />项目列表</Button>
      <Text className='generating-label'>{project.status === 'done' ? 'COMPLETE' : 'PROCESSING'} · {project.name}</Text>
      <View className='generating-value'>{progress}<Text>%</Text></View>
      <View className='generation-segments'>{Array.from({length:20},(_,i) => <View key={i} className={`generation-segment ${progress >= (i+1)*5 ? 'is-complete' : progress > i*5 ? 'is-active' : ''}`} />)}</View>
      <View className='generation-steps'>{STEPS.map((step,index) => { const finished = progress >= step.end, active = progress >= step.at && !finished
        return <View key={step.label} className={`generation-step ${!finished && !active ? 'is-waiting' : ''}`}><View className='generation-step__label'><Text className='step-number'>{String(index+1).padStart(2,'0')}</Text><Text>{step.label}</Text></View><Text className={`step-status ${active ? 'is-active' : ''}`}>{finished ? '完成' : active ? '进行中' : '等待'}</Text></View>
      })}</View>
      <Text className='generating-note'>预计 1–3 分钟。你可以离开此页，完成后会出现在项目列表中。</Text>
    </View>
  )
}
