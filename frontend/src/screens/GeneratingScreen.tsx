import { Button, Text, View } from '@tarojs/components'
import { useEffect } from 'react'

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
    return () => {
      disposed = true
      clearInterval(timer)
    }
  }, [project.id])

  const progress = Math.min(100, Math.round(project.progress))
  return (
    <View className='screen generating-screen safe-top safe-bottom'>
      <View className='progress-ring' style={{ background: `conic-gradient(#ff5b14 ${progress * 3.6}deg, #e4dfd5 0deg)` }}>
        <View className='progress-ring__inner'>
          <Text className='progress-ring__cube'>◇</Text>
          <Text className='progress-ring__value'>{progress}<Text className='progress-ring__unit'>%</Text></Text>
        </View>
      </View>
      <Text className='generating-title'>{project.status === 'done' ? '模型已生成' : '正在生成 3D 模型'}</Text>
      <Text className='generating-name'>{project.name}</Text>

      <View className='generation-steps'>
        {STEPS.map((step) => {
          const finished = progress >= step.end
          const active = progress >= step.at && !finished
          return (
            <View key={step.label} className={`generation-step ${!finished && !active ? 'generation-step--waiting' : ''}`}>
              <Text className={`generation-step__status ${finished ? 'is-finished' : active ? 'is-active' : ''}`}>
                {finished ? '✓' : active ? '•' : ''}
              </Text>
              <Text>{step.label}</Text>
            </View>
          )
        })}
      </View>

      <View className='generating-footer'>
        <Text className='generating-note'>预计需要 1–3 分钟，可离开页面，完成后在列表查看</Text>
        <Button className='secondary-button' onClick={onBack}>返回项目列表</Button>
      </View>
    </View>
  )
}

