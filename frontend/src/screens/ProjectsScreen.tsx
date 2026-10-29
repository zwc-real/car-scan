import { Button, Text, View } from '@tarojs/components'
import { useMemo, useState } from 'react'

import { MiniCar } from '../components/MiniCar'
import type { Project } from '../types/project'

type TabKey = 'all' | 'done' | 'processing'

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'done', label: '已完成' },
  { key: 'processing', label: '生成中' },
]

function formatFaces(value: number): string {
  return value >= 10000 ? `${(value / 10000).toFixed(1)} 万面` : `${value} 面`
}

function formatCreatedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  if (day === start) return `今天 ${time}`
  if (day === start - 86400000) return `昨天 ${time}`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function ProjectsScreen({
  projects,
  loading,
  onNew,
  onOpen,
  onRetry,
}: {
  projects: Project[]
  loading: boolean
  onNew: () => void
  onOpen: (project: Project) => void
  onRetry: () => void
}) {
  const [tab, setTab] = useState<TabKey>('all')
  const list = useMemo(
    () => projects.filter((project) => tab === 'all' || project.status === tab),
    [projects, tab],
  )

  return (
    <View className='screen projects-screen'>
      <View className='screen-scroll projects-scroll'>
        <Text className='eyebrow'>3D 扫描</Text>
        <Text className='page-title'>我的模型</Text>

        <Button className='new-project-card' onClick={onNew}>
          <View className='new-project-card__icon'>⌁</View>
          <View className='new-project-card__copy'>
            <Text className='new-project-card__title'>新建扫描项目</Text>
            <Text className='new-project-card__desc'>拍摄玩具车 10 个角度，自动生成 3D 模型</Text>
          </View>
          <Text className='new-project-card__arrow'>›</Text>
        </Button>

        <View className='section-heading'>
          <Text className='section-heading__title'>历史项目</Text>
          <Text className='section-heading__count'>{projects.length} 个</Text>
        </View>

        <View className='filter-tabs'>
          {TABS.map((item) => (
            <Button
              key={item.key}
              className={`filter-tab ${tab === item.key ? 'filter-tab--active' : ''}`}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </View>

        {loading ? (
          <View className='empty-state'>正在载入项目…</View>
        ) : list.length === 0 ? (
          <View className='empty-state'>
            <Text>暂无项目</Text>
            <Button className='text-button' onClick={onRetry}>重新加载</Button>
          </View>
        ) : (
          <View className='project-grid'>
            {list.map((project) => (
              <Button key={project.id} className='project-card' onClick={() => onOpen(project)}>
                <View className='project-card__visual'>
                  <MiniCar color={project.color} />
                  {project.status === 'processing' ? (
                    <View className='processing-badge'>
                      <Text>生成中 {Math.min(99, Math.round(project.progress))}%</Text>
                      <View className='processing-badge__track'>
                        <View className='processing-badge__value' style={{ width: `${project.progress}%` }} />
                      </View>
                    </View>
                  ) : (
                    <Text className='model-badge'>◇ 3D</Text>
                  )}
                </View>
                <View className='project-card__body'>
                  <Text className='project-card__name'>{project.name}</Text>
                  <Text className='project-card__meta'>{formatCreatedAt(project.createdAt)}</Text>
                  <Text className='project-card__meta'>
                    {project.photoCount} 张 · {project.status === 'done' ? formatFaces(project.faces) : '处理中'}
                  </Text>
                </View>
              </Button>
            ))}
          </View>
        )}
      </View>

      <Button className='floating-add' aria-label='新建扫描' onClick={onNew}>＋</Button>
    </View>
  )
}

