declare namespace JSX {
  interface IntrinsicElements {
    'glb-scene': {
      src: string
      clay: boolean
      auto: boolean
      width: number
      height: number
      style: string
      onModelready: () => void
      onModelerror: () => void
    }
  }
}
