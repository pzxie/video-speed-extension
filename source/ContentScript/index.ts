import AnyTouch from 'any-touch';
import doubletap from '@any-touch/doubletap';
import browser from 'webextension-polyfill';

let doubleTapSpeedTime = 5;
const progressShowTime = 1;

const progress = document.createElement('div');
progress.style.position = 'fixed';
progress.style.display = 'none';
progress.style.background = 'rgba(0, 0, 0, .8)';
progress.style.padding = '6px';
progress.style.borderRadius = '4px';
progress.style.zIndex = '999999';
progress.style.boxSizing = 'border-box';

const timeContainer = document.createElement('div');
timeContainer.style.fontSize = '12px';
timeContainer.style.color = 'white';
timeContainer.style.marginTop = '6px';

const realProgressContainer = document.createElement('div');
realProgressContainer.style.position = 'relative';
realProgressContainer.style.height = '6px';
realProgressContainer.style.width = '100%';
realProgressContainer.style.background = 'rgba(205, 205, 205, .8)';
realProgressContainer.style.borderRadius = '2px';

const realProgress = document.createElement('div');
realProgress.style.position = 'absolute';
realProgress.style.top = '0';
realProgress.style.left = '0';
realProgress.style.background = 'rgb(15 76 199 / 80%)';
realProgress.style.height = '100%';
realProgress.style.borderRadius = '2px';

// eslint-disable-next-line no-undef
let hideTimer: NodeJS.Timeout | undefined;
// eslint-disable-next-line no-undef
let throttleTimer: NodeJS.Timeout | undefined;

function timeFormat(realtime: number) {
  const time = Math.floor(realtime);

  const hour = Math.floor(time / 3600);
  const min = Math.floor((time / 60) % 60);
  const sec = time % 60;

  return [hour, min, sec]
    .map((item) => (item < 10 ? `0${item}` : item))
    .join(':');
}

function hideProgress() {
  progress.style.display = 'none';
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = undefined;
}

function showProgress(video: HTMLVideoElement) {
  if (throttleTimer) {
    return;
  }

  video.parentElement?.appendChild(progress);

  if (hideTimer) clearTimeout(hideTimer);

  const {duration, currentTime} = video;

  if (!duration) return;

  const {top, height, width} = video.getBoundingClientRect();

  realProgress.style.width = `${Math.min(
    (currentTime / duration) * 100,
    100
  )}%`;
  progress.style.width = `${width}px`;
  progress.style.top = `${top + height - 45}px`;
  progress.style.display = 'block';
  timeContainer.innerHTML = `${timeFormat(currentTime)}&nbsp;/&nbsp;${
    duration ? timeFormat(duration) : '-'
  }`;

  hideTimer = setTimeout(() => {
    hideProgress();
  }, progressShowTime * 1000);

  throttleTimer = setTimeout(() => {
    const time = throttleTimer;
    throttleTimer = undefined;

    // eslint-disable-next-line no-undef
    clearTimeout(time as NodeJS.Timeout);
  }, 100);
}

function syncDoubleTapSpeedTime() {
  browser.storage.local.get('speedTime').then(({speedTime}) => {
    doubleTapSpeedTime = +speedTime || 5;

    console.log('sync double tap speed to ', doubleTapSpeedTime);
  });
}

const at = new AnyTouch(document.body, {
  preventDefault() {
    return false;
  },
});
at.use(doubletap);

at.on('pan', (e) => {
  const target = e.target as HTMLVideoElement;

  if (!target || target.tagName !== 'VIDEO') return;

  const {deltaX} = e;
  const deltaTime = target.duration
    ? (deltaX / target.clientWidth) * target.duration
    : 2;

  let {currentTime} = target;

  currentTime += deltaTime;

  if (currentTime > target.duration) currentTime = target.duration;
  else if (currentTime < 0) currentTime = 0;

  target.currentTime = currentTime;
  target.play();

  if (e.phase === 'end') {
    throttleTimer = undefined;
  }

  showProgress(target);
});

at.on('doubletap', (e) => {
  const target = e.target as HTMLVideoElement;

  if (!target || target.tagName !== 'VIDEO') return;

  const {left, width} = target.getBoundingClientRect();
  console.log(e);

  const isLeft = e.x < left + width / 2;

  if (isLeft) target.currentTime -= doubleTapSpeedTime;
  else target.currentTime += doubleTapSpeedTime;

  showProgress(target);
});

realProgressContainer.appendChild(realProgress);
progress.appendChild(realProgressContainer);
progress.appendChild(timeContainer);
document.body.appendChild(progress);

syncDoubleTapSpeedTime();

browser.runtime.onMessage.addListener((message) => {
  if (message.type !== 'video_faster_double_tap_speed') return;

  syncDoubleTapSpeedTime();
});

document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') {
    syncDoubleTapSpeedTime();
  }
});

export {};
