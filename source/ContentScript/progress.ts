import { progressShowTime, lockShowTime } from './config'

import lockSvg from '../assets/lock.svg'
import unlockSvg from '../assets/unlock.svg'


function timeFormat(realtime: number) {
  const time = Math.floor(realtime)

  const hour = Math.floor(time / 3600)
  const min = Math.floor((time / 60) % 60)
  const sec = time % 60

  return [hour, min, sec].map(item => (item < 10 ? `0${item}` : item)).join(':')
}

function createProgressBarElements () {
  const progress = document.createElement('div')
  progress.style.position = 'fixed'
  progress.style.display = 'none'
  progress.style.background = 'rgba(0, 0, 0, .8)'
  progress.style.padding = '6px'
  progress.style.borderRadius = '4px'
  progress.style.zIndex = '999999'
  progress.style.boxSizing = 'border-box'

  const timeContainer = document.createElement('div')
  timeContainer.style.fontSize = '12px'
  timeContainer.style.color = 'white'
  timeContainer.style.marginTop = '6px'

  const realProgressContainer = document.createElement('div')
  realProgressContainer.style.position = 'relative'
  realProgressContainer.style.height = '6px'
  realProgressContainer.style.width = '100%'
  realProgressContainer.style.background = 'rgba(205, 205, 205, .8)'
  realProgressContainer.style.borderRadius = '2px'

  const realProgress = document.createElement('div')
  realProgress.style.position = 'absolute'
  realProgress.style.top = '0'
  realProgress.style.left = '0'
  realProgress.style.background = 'rgb(15 76 199 / 80%)'
  realProgress.style.height = '100%'
  realProgress.style.borderRadius = '2px'

  return {
    progress,
    timeContainer,
    realProgressContainer,
    realProgress
  }
}

function createLockElements () {
  const lockElement = document.createElement('div')
  const lockImg = document.createElement('img')
  const style = lockElement.style
  style.position = 'fixed'
  style.display = 'flex'
  style.right = '10%'
  style.width = '40px'
  style.height = '40px'
  style.alignItems = 'center'
  style.justifyContent = 'center'
  style.scale = '0'
  style.textAlign = 'center'
  style.borderRadius = '50%'
  style.background = 'rgb(0, 0, 0)'
  style.opacity = '.5'
  style.zIndex = '999999'
  style.transition = 'all .2s'
  lockImg.style.width = '28px'
  lockImg.style.height = '28px'
  lockElement.appendChild(lockImg)

  return {
    lockElement,
    lockImg
  }
}

export class Progress {
  container: HTMLElement = document.body

  progress: HTMLElement

  realProgress: HTMLElement

  timeContainer: HTMLElement

  lockElement: HTMLElement

  lockImg: HTMLImageElement

  hideTimer: NodeJS.Timeout | undefined

  throttleTimer: NodeJS.Timeout | undefined

  lockHideTimer: NodeJS.Timeout | undefined

  isLock = false

  constructor(container?: HTMLElement) {
    if (container) this.container = container
  }

  init() {
    const { progress, timeContainer, realProgress, realProgressContainer } = createProgressBarElements()
    const { lockElement, lockImg } = createLockElements()

    this.progress = progress
    this.timeContainer = timeContainer
    this.realProgress = realProgress

    this.lockElement = lockElement
    this.lockImg = lockImg

    lockElement.addEventListener('click', () => {
      if (this.isLock) {
        this.unLock()
        return
      }
      
      this.lock()
    })

    realProgressContainer.appendChild(realProgress)
    progress.appendChild(realProgressContainer)
    progress.appendChild(timeContainer)
    this.container.appendChild(progress)
    this.container.appendChild(lockElement)
  }

  hide() {
    this.progress.style.display = 'none'
    if (this.hideTimer) clearTimeout(this.hideTimer)
    this.hideTimer = undefined
  }

  show(video: HTMLVideoElement, isLast?: boolean) {
    if (isLast) this.throttleTimer = undefined

    if (this.throttleTimer) {
      return
    }

    video.parentElement?.appendChild(this.progress)

    if (this.hideTimer) clearTimeout(this.hideTimer)

    const { duration, currentTime } = video

    if (!duration) return

    const { top, height, width } = video.getBoundingClientRect()

    this.realProgress.style.width = `${Math.min(
      (currentTime / duration) * 100,
      100,
    )}%`
    this.progress.style.width = `${width}px`
    this.progress.style.top = `${top + height - 45}px`
    this.progress.style.display = 'block'
    this.timeContainer.innerHTML = `${timeFormat(currentTime)}&nbsp;/&nbsp;${
      duration ? timeFormat(duration) : '-'
    }`

    this.hideTimer = setTimeout(() => {
      this.hide()
    }, progressShowTime * 1000)

    this.throttleTimer = setTimeout(() => {
      const time = this.throttleTimer
      this.throttleTimer = undefined

      clearTimeout(time as NodeJS.Timeout)
    }, 100)
  }

  showLock(video: HTMLVideoElement) {
    if (this.lockHideTimer) {
      this.resetLockHideTimer()
    }
    video.parentElement?.appendChild(this.lockElement)

    this.lockImg.src = this.isLock ? lockSvg : unlockSvg

    const { top, height } = video.getBoundingClientRect()

    const style = this.lockElement.style
    style.top = `${top + height / 2 - 20}px`
    style.scale = '1'

    this.lockHideTimer = setTimeout(() => {
      this.hideLock()
    }, lockShowTime * 1000)
  }

  hideLock() {
    this.resetLockHideTimer()
    this.lockElement.style.scale = '0'
  }

  lock() {
    this.resetLockHideTimer()
    this.isLock = true
    this.lockImg.src = lockSvg

    this.lockHideTimer = setTimeout(() => {
      this.hideLock()
    }, lockShowTime * 1000)
  }

  unLock() {
    this.resetLockHideTimer()
    this.isLock = false
    this.lockImg.src = unlockSvg

    this.lockHideTimer = setTimeout(() => {
      this.hideLock()
    }, lockShowTime * 1000)
  }

  private resetLockHideTimer () {
    clearTimeout(this.lockHideTimer);
    this.lockHideTimer = undefined
  }
}
