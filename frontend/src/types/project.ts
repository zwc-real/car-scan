export type ProjectStatus = 'draft' | 'processing' | 'done'

export interface Project {
  id: string
  name: string
  createdAt: string
  photoCount: number
  color: string
  status: ProjectStatus
  progress: number
  faces: number
  coverUrl?: string
}

export type ViewKey =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'leftFront'
  | 'rightFront'
  | 'leftBack'
  | 'rightBack'

export type PhotoMap = Partial<Record<ViewKey, string>>

