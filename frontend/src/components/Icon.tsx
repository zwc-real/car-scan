import { Image } from '@tarojs/components'
import back from '../assets/icons/back.svg'
import plus from '../assets/icons/plus.svg'
import camera from '../assets/icons/camera.svg'
import image from '../assets/icons/image.svg'
import trash from '../assets/icons/trash.svg'
import cube from '../assets/icons/cube.svg'
import check from '../assets/icons/check.svg'
import share from '../assets/icons/share.svg'
import download from '../assets/icons/download.svg'
import refresh from '../assets/icons/refresh.svg'
import chevron from '../assets/icons/chevron.svg'
import rotate from '../assets/icons/rotate.svg'
import sparkle from '../assets/icons/sparkle.svg'
import close from '../assets/icons/close.svg'
import hand from '../assets/icons/hand.svg'
const icons = { back, plus, camera, image, trash, cube, check, share, download, refresh, chevron, rotate, sparkle, close, hand }
export function Icon({ name, inverse = false }: { name: keyof typeof icons; inverse?: boolean }) {
 return <Image className={`icon ${inverse ? 'icon--inverse' : ''}`} src={icons[name]} mode='aspectFit' />
}
