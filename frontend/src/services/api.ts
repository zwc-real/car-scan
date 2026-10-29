import Taro from '@tarojs/taro'

import type { Project, ProjectStatus, ViewKey } from '../types/project'

const API_BASE = (process.env.TARO_APP_API_BASE_URL || 'http://127.0.0.1:5000/api').replace(/\/$/, '')

interface ApiProject {
  id: string
  name: string
  created_at: string
  photo_count: number
  color: string
  status: ProjectStatus
  progress: number
  faces: number
  cover_url?: string
}

interface ApiEnvelope<T> {
  data: T
  message?: string
}

function normalizeProject(project: ApiProject): Project {
  return {
    id: project.id,
    name: project.name,
    createdAt: project.created_at,
    photoCount: project.photo_count,
    color: project.color,
    status: project.status,
    progress: project.progress,
    faces: project.faces,
    coverUrl: project.cover_url,
  }
}

async function request<T>(options: Taro.request.Option): Promise<T> {
  const response = await Taro.request<ApiEnvelope<T>>({
    ...options,
    url: `${API_BASE}${options.url}`,
    header: {
      'content-type': 'application/json',
      ...options.header,
    },
  })

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(response.data?.message || `请求失败（${response.statusCode}）`)
  }
  return response.data.data
}

export async function fetchProjects(status?: Exclude<ProjectStatus, 'draft'>): Promise<Project[]> {
  const query = status ? `?status=${status}` : ''
  const data = await request<ApiProject[]>({ url: `/projects${query}`, method: 'GET' })
  return data.map(normalizeProject)
}

export async function fetchProject(id: string): Promise<Project> {
  return normalizeProject(await request<ApiProject>({ url: `/projects/${id}`, method: 'GET' }))
}

export async function createProject(name: string, sample: boolean): Promise<Project> {
  const project = await request<ApiProject>({
    url: '/projects',
    method: 'POST',
    data: { name, sample },
  })
  return normalizeProject(project)
}

export async function uploadProjectPhoto(projectId: string, viewKey: ViewKey, filePath: string): Promise<void> {
  const response = await Taro.uploadFile({
    url: `${API_BASE}/projects/${projectId}/photos`,
    filePath,
    name: 'photo',
    formData: { view_key: viewKey },
  })
  const body = JSON.parse(response.data || '{}') as ApiEnvelope<unknown>
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(body.message || `照片上传失败（${response.statusCode}）`)
  }
}

export async function startGeneration(projectId: string): Promise<Project> {
  return normalizeProject(await request<ApiProject>({ url: `/projects/${projectId}/generate`, method: 'POST' }))
}

export async function regenerateProject(projectId: string): Promise<Project> {
  return normalizeProject(await request<ApiProject>({ url: `/projects/${projectId}/regenerate`, method: 'POST' }))
}

export async function requestModelExport(projectId: string): Promise<string> {
  const data = await request<{ message: string }>({ url: `/projects/${projectId}/export`, method: 'POST' })
  return data.message
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '操作失败，请稍后重试'
}

