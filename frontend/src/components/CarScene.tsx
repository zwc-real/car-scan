import { View } from '@tarojs/components'
import type { ReactNode } from 'react'

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)))
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`
}

interface BoxProps {
  sx: number; sy: number; sz: number
  x?: number; y?: number; z?: number
  rz?: number
  color: string
}

/** 以中心为原点的长方体(x 长度 / y 高度向下 / z 宽度) */
function Box({ sx, sy, sz, x = 0, y = 0, z = 0, rz = 0, color }: BoxProps) {
  const face = (w: number, h: number, t: string, f: number): ReactNode => (
    <View
      style={{
        position: 'absolute', left: '50%', top: '50%', width: w, height: h,
        marginLeft: -w / 2, marginTop: -h / 2, background: shade(color, f),
        transform: t, backfaceVisibility: 'hidden',
      }}
    />
  )
  return (
    <View style={{ position: 'absolute', transformStyle: 'preserve-3d', transform: `translate3d(${x}px,${y}px,${z}px) rotateZ(${rz}deg)` }}>
      {face(sx, sy, `translateZ(${sz / 2}px)`, 1)}
      {face(sx, sy, `rotateY(180deg) translateZ(${sz / 2}px)`, 0.72)}
      {face(sz, sy, `rotateY(90deg) translateZ(${sx / 2}px)`, 0.86)}
      {face(sz, sy, `rotateY(-90deg) translateZ(${sx / 2}px)`, 0.8)}
      {face(sx, sz, `rotateX(90deg) translateZ(${sy / 2}px)`, 1.18)}
      {face(sx, sz, `rotateX(-90deg) translateZ(${sy / 2}px)`, 0.5)}
    </View>
  )
}

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <>
      <Box sx={30} sy={30} sz={14} x={x} y={-15} z={z} color="#26241F" />
      <Box sx={30} sy={30} sz={14} x={x} y={-15} z={z} rz={45} color="#26241F" />
      <Box sx={13} sy={13} sz={15} x={x} y={-15} z={z} rz={22} color="#C9C5BB" />
    </>
  )
}

export function Car({ color, clay }: { color: string; clay: boolean }) {
  const body = clay ? '#DAD6CC' : color
  const glass = clay ? '#BDB9AF' : '#2A3A52'
  const light = (c: string) => (clay ? '#CFCBC1' : c)
  const stripe = clay ? '#DAD6CC' : '#F6F3EE'
  return (
    <>
      <View style={{ position: 'absolute', width: 250, height: 140, marginLeft: -125, marginTop: -70, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(20,20,20,.25), transparent)', transform: 'translateY(1px) rotateX(90deg)' }} />
      <Box sx={150} sy={4} sz={70} y={-13} color="#26241F" />
      <Box sx={160} sy={26} sz={84} y={-27} color={body} />
      <Box sx={150} sy={1} sz={14} y={-40.5} color={stripe} />
      <Box sx={80} sy={10} sz={76} x={-12} y={-45} color={body} />
      <Box sx={72} sy={16} sz={70} x={-12} y={-58} color={glass} />
      <Box sx={76} sy={6} sz={74} x={-12} y={-69} color={body} />
      <Box sx={70} sy={1} sz={14} x={-12} y={-72.5} color={stripe} />
      <Box sx={14} sy={4} sz={84} x={-76} y={-50} color={body} />
      <Box sx={4} sy={10} sz={4} x={-76} y={-44} z={30} color="#26241F" />
      <Box sx={4} sy={10} sz={4} x={-76} y={-44} z={-30} color="#26241F" />
      <Box sx={3} sy={7} sz={16} x={80.5} y={-32} z={26} color={light('#FFD44D')} />
      <Box sx={3} sy={7} sz={16} x={80.5} y={-32} z={-26} color={light('#FFD44D')} />
      <Box sx={3} sy={7} sz={16} x={-80.5} y={-32} z={26} color={light('#D92B2B')} />
      <Box sx={3} sy={7} sz={16} x={-80.5} y={-32} z={-26} color={light('#D92B2B')} />
      <Wheel x={50} z={47} />
      <Wheel x={50} z={-47} />
      <Wheel x={-50} z={47} />
      <Wheel x={-50} z={-47} />
    </>
  )
}


/** 复用新版原型的立体几何；外层控制旋转、俯仰和缩放。AI 模型接入前仅用于演示。 */
export function CarScene({ color, clay, yaw, pitch, scale }: { color: string; clay: boolean; yaw: number; pitch: number; scale: number }) {
 return <View className='car-scene'><View className='car-scene__origin' style={{ transform: `scale(${scale}) rotateX(${pitch}deg) rotateY(${yaw}deg)` }}><Car color={color} clay={clay} /></View></View>
}
