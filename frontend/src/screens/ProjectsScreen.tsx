import { Button, Image, Text, View } from '@tarojs/components'
import { useMemo, useState } from 'react'

import { Icon } from '../components/Icon'
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
      <View className='projects-header'>
        <View className='eyebrow-row'><Text>Toy Scan / 3D</Text><Text>{String(projects.length).padStart(2, '0')} 项</Text></View>
        <Text className='page-title'>项目</Text>
        <Text className='page-description'>围着玩具车拍 10 张照片，得到一个可旋转的 3D 模型。</Text>
        <View className='filter-tabs'>{TABS.map(item => <Button key={item.key} className={`filter-tab ${tab === item.key ? 'filter-tab--active' : ''}`} onClick={() => setTab(item.key)}>{item.label}</Button>)}</View>
      </View>
      <View className='screen-scroll projects-scroll'>
        {loading ? <View className='empty-state'>正在载入项目…</View> : list.length === 0 ? <View className='empty-state'><Text>没有项目</Text><Button className='text-button' onClick={onRetry}>重新加载</Button></View> :
        list.map(project => <Button key={project.id} className='project-row' onClick={() => onOpen(project)}>
          <View className='project-thumb grid-paper'>{project.coverUrl ? <Image className='project-cover' src={project.coverUrl} mode='aspectFill' /> : <MiniCar color={project.color} />}</View>
          <View className='project-copy'><Text className='project-number'>NO.{String(projects.length - projects.indexOf(project)).padStart(3, '0')}</Text><Text className='project-name'>{project.name}</Text><Text className='project-meta'>{formatCreatedAt(project.createdAt)} · {project.photoCount} 张{project.status === 'done' ? ` · ${formatFaces(project.faces)}` : ''}</Text>
          {project.status === 'processing' && <View className='row-progress'><View style={{width: `${project.progress}%`}} /></View>}</View>
          {project.status === 'processing' ? <Text className='project-percent'>{Math.min(99, Math.round(project.progress))}%</Text> : <Icon name='chevron' />}
        </Button>)}
      </View>
      <View className='bottom-action'><Button className='primary-button' onClick={onNew}><Text>新建扫描</Text><Icon name='plus' inverse /></Button></View>
    </View>
  )
}
