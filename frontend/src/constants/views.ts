import type { ViewKey } from '../types/project'

export interface ViewDefinition {
  key: ViewKey
  label: string
  hint: string
  code: string
  dotX: number
  dotY: number
  vertical?: 'top' | 'bottom'
}

// 坐标以示意卡片左上角为原点，保持与 Figma 原型的顺时针拍摄顺序一致。
export const VIEWS: ViewDefinition[] = [
  { key: 'front', label: '正前方', hint: '正对车头', code: 'FRONT', dotX: 50, dotY: 9 },
  { key: 'back', label: '正后方', hint: '正对车尾', code: 'REAR', dotX: 50, dotY: 91 },
  { key: 'left', label: '左侧', hint: '正对驾驶侧车身', code: 'LEFT', dotX: 9, dotY: 50 },
  { key: 'right', label: '右侧', hint: '正对副驾侧车身', code: 'RIGHT', dotX: 91, dotY: 50 },
  { key: 'top', label: '顶部', hint: '站高，从正上方俯拍', code: 'TOP', dotX: 50, dotY: 9, vertical: 'top' },
  { key: 'bottom', label: '底部', hint: '翻转车身，拍摄底盘', code: 'BOTTOM', dotX: 50, dotY: 91, vertical: 'bottom' },
  { key: 'leftFront', label: '左前 45°', hint: '车头与左侧之间', code: 'FRONT-L', dotX: 21, dotY: 21 },
  { key: 'rightFront', label: '右前 45°', hint: '车头与右侧之间', code: 'FRONT-R', dotX: 79, dotY: 21 },
  { key: 'leftBack', label: '左后 45°', hint: '车尾与左侧之间', code: 'REAR-L', dotX: 21, dotY: 79 },
  { key: 'rightBack', label: '右后 45°', hint: '车尾与右侧之间', code: 'REAR-R', dotX: 79, dotY: 79 },
]

