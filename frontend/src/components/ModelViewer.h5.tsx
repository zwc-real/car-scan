import { View } from '@tarojs/components'
import { useEffect, useId, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

import type { ModelViewerProps } from '../types/model'

/** Three.js 和 GLTFLoader 使用同一固定版本，仅打入 H5 预览分块。 */
export function ModelViewer(props: ModelViewerProps) {
  const id = useId().replace(/:/g, '')
  const current = useRef(props)
  current.current = props

  useEffect(() => {
    const host = document.getElementById(id)
    if (!host) return
    let disposed = false
    let frame = 0
    let model: THREE.Group | undefined
    let renderer: THREE.WebGLRenderer | undefined
    let controls: OrbitControls | undefined
    let environment: THREE.WebGLRenderTarget | undefined
    let observer: ResizeObserver | undefined
    const abort = new AbortController()
    const clay = new THREE.MeshStandardMaterial({ color: '#dedbd3', roughness: .85, metalness: 0 })
    const scene = new THREE.Scene()
    const materials = new Set<THREE.Material>()
    const textures = new Set<THREE.Texture>()

    const releaseModel = (root: THREE.Group) => {
      root.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return
        object.geometry.dispose()
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          materials.add(material)
          for (const value of Object.values(material)) {
            if (value instanceof THREE.Texture) textures.add(value)
          }
        }
      })
      textures.forEach(texture => {
        texture.dispose()
        if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) texture.image.close()
      })
      materials.forEach(material => material.dispose())
    }

    const load = async () => {
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.15
        renderer.setClearColor(0x000000, 0)
        renderer.domElement.setAttribute('aria-label', '真实 GLB 测试模型')
        host.appendChild(renderer.domElement)
        const camera = new THREE.PerspectiveCamera(40, 1, .01, 100)
        camera.position.set(2.6, 1.35, 3.4)
        let radius = 1.3
        let fitDistance = 0
        controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.enablePan = false
        controls.minDistance = 1.6
        controls.maxDistance = 8
        controls.autoRotateSpeed = 1.2
        controls.addEventListener('start', () => current.current.onInteract())

        // 环境光为 PBR 金属/粗糙度贴图提供反射，不修改原始材质。
        const pmrem = new THREE.PMREMGenerator(renderer)
        const room = new RoomEnvironment()
        environment = pmrem.fromScene(room, .04)
        scene.environment = environment.texture
        room.dispose()
        pmrem.dispose()
        scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8275, 1.5))
        const key = new THREE.DirectionalLight(0xffffff, 2.5)
        key.position.set(3, 5, 4)
        scene.add(key)

        const fitCamera = () => {
          // 竖屏应按水平视角拟合包围球，否则宽模型会被画布左右裁切。
          const halfFov = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.min(1, camera.aspect))
          const distance = radius / Math.sin(halfFov) * 1.08
          if (fitDistance) camera.position.multiplyScalar(distance / fitDistance)
          else camera.position.normalize().multiplyScalar(distance)
          fitDistance = distance
          if (controls) { controls.minDistance = distance * .4; controls.maxDistance = distance * 2.5 }
        }
        const resize = () => {
          const { width, height } = host.getBoundingClientRect()
          if (!width || !height || !renderer) return
          renderer.setSize(width, height)
          camera.aspect = width / height
          camera.updateProjectionMatrix()
          fitCamera()
        }
        observer = new ResizeObserver(resize)
        observer.observe(host)
        resize()
        const animate = () => {
          if (disposed || !renderer || !controls) return
          controls.autoRotate = current.current.auto
          scene.overrideMaterial = current.current.clay ? clay : null
          controls.update()
          renderer.render(scene, camera)
          frame = requestAnimationFrame(animate)
        }
        animate()

        const response = await fetch(props.url, { signal: abort.signal })
        if (!response.ok) throw new Error(`模型下载失败（${response.status}）`)
        const gltf = await new GLTFLoader().parseAsync(await response.arrayBuffer(), '')
        if (disposed) { releaseModel(gltf.scene); return }
        model = gltf.scene
        const bounds = new THREE.Box3().setFromObject(model)
        const size = bounds.getSize(new THREE.Vector3())
        const center = bounds.getCenter(new THREE.Vector3())
        // 按包围盒居中、归一化，适配不同尺寸的后续真实模型。
        const scale = 2.4 / Math.max(size.x, size.y, size.z, .001)
        model.position.copy(center).multiplyScalar(-scale)
        model.scale.setScalar(scale)
        scene.add(model)
        radius = size.length() * scale / 2
        fitCamera()
        current.current.onLoaded()
      } catch (error) {
        if (!disposed) current.current.onError(error instanceof Error ? error.message : '模型加载失败')
      }
    }
    void load()
    return () => {
      disposed = true
      abort.abort()
      cancelAnimationFrame(frame)
      observer?.disconnect()
      controls?.dispose()
      if (model) releaseModel(model)
      clay.dispose()
      environment?.dispose()
      renderer?.dispose()
      renderer?.domElement.remove()
    }
  }, [id, props.url])

  return <View id={id} className='glb-viewer' />
}
