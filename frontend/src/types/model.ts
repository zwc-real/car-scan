export interface PreviewModel {
  url: string
  name: string
  placeholder: boolean
  bytes: number
  faces: number
  textures: number
}

export interface ModelViewerProps {
  url: string
  clay: boolean
  auto: boolean
  onInteract: () => void
  onLoaded: () => void
  onError: (message: string) => void
}
