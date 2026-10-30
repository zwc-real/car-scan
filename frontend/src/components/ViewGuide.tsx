import { Image } from '@tarojs/components'
import type { ViewDefinition } from '../constants/views'
/** 按新版原型保留线稿及拍摄方位；SVG 用 Image 承载。 */
export function ViewGuide({ view }: { view: ViewDefinition }) {
 const ink = '#141414', red = '#E5391B'
 const pos = (a: number, r: number) => ({ x: 60 + r * Math.sin(a * Math.PI / 180), y: 60 - r * Math.cos(a * Math.PI / 180) })
 const angles: Record<string, number> = { front: 0, back: 180, left: 270, right: 90, leftFront: 315, rightFront: 45, leftBack: 225, rightBack: 135 }
 const cam = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="${red}" stroke-width="1" opacity=".5"/><circle cx="${x}" cy="${y}" r="5" fill="${red}"/>`
 let content: string
 if (view.vertical) {
  const top = view.vertical === 'top'
  content = `<line x1="6" x2="114" y1="${top ? 84 : 76}" y2="${top ? 84 : 76}" stroke="${ink}" stroke-dasharray="2 3" opacity=".5"/><g transform="translate(0 ${top ? 4 : -4})" fill="none" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"><path d="M24 70V60q0-4 6-5l15-2 8-12q2-2 6-2h18q4 0 6 4l5 10 4 2q4 2 4 6v9z"/><path d="M55 43h21l4 9H50z"/><circle cx="42" cy="70" r="7" fill="#ECEAE3"/><circle cx="78" cy="70" r="7" fill="#ECEAE3"/></g><path d="${top ? 'M60 24V38M56 35l4 4 4-4' : 'M60 96V84M56 87l4-4 4 4'}" fill="none" stroke="${red}" stroke-width="1.4" stroke-dasharray="2 2.5"/>${cam(60, top ? 14 : 106)}`
 } else {
  const angle = angles[view.key], c = pos(angle, 47), t = pos(angle, 32)
  content = `<circle cx="60" cy="60" r="47" fill="none" stroke="${ink}" stroke-dasharray="1.5 3.5" opacity=".5"/>${[0,45,90,135,180,225,270,315].filter(a => a !== angle).map(a => { const p = pos(a,47); return `<circle cx="${p.x}" cy="${p.y}" r="1.6" fill="${ink}" opacity=".35"/>` }).join('')}<g fill="none" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"><rect x="45" y="27" width="30" height="66" rx="11"/><rect x="49" y="42" width="22" height="11" rx="2"/><rect x="49" y="70" width="22" height="9" rx="2"/><path d="M60 33l-3.5 5h7z" fill="${ink}" stroke="none"/>${[[41,35],[75,35],[41,75],[75,75]].map(([x,y]) => `<rect x="${x}" y="${y}" width="4" height="10" rx="1" fill="${ink}" stroke="none"/>`).join('')}</g><line x1="${c.x}" y1="${c.y}" x2="${t.x}" y2="${t.y}" stroke="${red}" stroke-width="1.4" stroke-dasharray="2 2.5"/>${cam(c.x,c.y)}`
 }
 return <Image className='view-guide' src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">${content}</svg>`)}`} mode='aspectFit' />
}
