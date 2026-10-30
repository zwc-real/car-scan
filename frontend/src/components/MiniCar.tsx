import { Image } from '@tarojs/components'
/** 原型侧视 SVG，作为 Image 使用，兼容 H5 与小程序。 */
export function MiniCar({ color }: { color: string }) {
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><ellipse cx="60" cy="68" rx="46" ry="5" fill="#1B1A17" opacity=".12"/><path d="M12 58V44q0-5 6-6l18-3 10-14q2-3 6-3h24q4 0 7 4l10 13 12 3q5 2 5 7v13z" fill="${color}"/><path d="M46 24h22l9 12H38z" fill="#2A3A52"/><rect x="56" y="24" width="2.5" height="12" fill="${color}"/><circle cx="34" cy="58" r="9" fill="#26241F"/><circle cx="88" cy="58" r="9" fill="#26241F"/><circle cx="34" cy="58" r="3.5" fill="#C9C5BB"/><circle cx="88" cy="58" r="3.5" fill="#C9C5BB"/><rect x="107" y="44" width="5" height="5" rx="1.5" fill="#FFD44D"/></svg>`
 return <Image className='mini-car' src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} mode='aspectFit' />
}
