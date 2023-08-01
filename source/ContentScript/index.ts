import AnyTouch from 'any-touch'
import doubletap from '@any-touch/doubletap'
import browser from 'webextension-polyfill'

import { Progress } from './progress'
import { doubleTapSpeedTime as defaultDoubleTapSpeedTime } from './config'

let doubleTapSpeedTime = defaultDoubleTapSpeedTime

function syncDoubleTapSpeedTime() {
  browser.storage.local.get('speedTime').then(({ speedTime }) => {
    doubleTapSpeedTime = +speedTime || 5
  })
}

const progress = new Progress()
progress.init()

const at = new AnyTouch(document.body, {
  preventDefault() {
    return false
  },
})
at.use(doubletap)

at.on('pan', e => {
  if (progress.isLock) return

  const target = e.target as HTMLVideoElement

  if (!target || target.tagName !== 'VIDEO') return

  const { deltaX, deltaY } = e
  const deltaTime = target.duration
    ? (deltaX / target.clientWidth) * target.duration
    : 2

  let { currentTime } = target

  currentTime += deltaTime

  if (currentTime > target.duration) currentTime = target.duration
  else if (currentTime < 0) currentTime = 0

  target.currentTime = currentTime
  target.play()

  console.log(`[x: ${deltaX}, y: ${deltaY}]`)

  progress.show(target, e.phase === 'end')
})

at.on('tap', e => {
  const target = e.target as HTMLVideoElement

  if (!target || target.tagName !== 'VIDEO') return

  progress.showLock(target)
});

at.on('doubletap', e => {
  if (progress.isLock) return

  const target = e.target as HTMLVideoElement

  if (!target || target.tagName !== 'VIDEO') return

  const { left, width } = target.getBoundingClientRect()

  const isLeft = e.x < left + width / 2

  if (isLeft) target.currentTime -= doubleTapSpeedTime
  else target.currentTime += doubleTapSpeedTime

  progress.show(target)
})

syncDoubleTapSpeedTime()

browser.runtime.onMessage.addListener(message => {
  if (message.type !== 'video_faster_double_tap_speed') return

  syncDoubleTapSpeedTime()
})

document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') {
    syncDoubleTapSpeedTime()
  }
})

export {}
