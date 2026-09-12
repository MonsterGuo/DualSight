import { MediaKind, type MediaSource } from '../types'

const IMG_BASE =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&auto=format'

/** Same photograph with desaturation / contrast tweak applied via Imgix params. */
const IMG_EDITED = `${IMG_BASE}&sat=-40&con=14`

/** Public test clip (Video.js CDN, CORS enabled, ~47s 960x400 H.264). */
const VIDEO_SRC = 'https://vjs.zencdn.net/v/oceans.mp4'

let seq = 0
const nextId = () => `ex-${++seq}-${Date.now()}`

export function exampleImagePair(): { a: MediaSource; b: MediaSource } {
  return {
    a: {
      id: nextId(),
      kind: MediaKind.Image,
      url: IMG_BASE,
      name: 'landscape_original.jpg',
      width: 1200,
      height: 800,
      duration: null,
      crossOrigin: true,
      isExample: true,
    },
    b: {
      id: nextId(),
      kind: MediaKind.Image,
      url: IMG_EDITED,
      name: 'landscape_edited.jpg',
      width: 1200,
      height: 800,
      duration: null,
      crossOrigin: true,
      isExample: true,
    },
  }
}

export function exampleVideoPair(): { a: MediaSource; b: MediaSource } {
  return {
    a: {
      id: nextId(),
      kind: MediaKind.Video,
      url: VIDEO_SRC,
      name: 'ocean_original.mp4',
      width: 960,
      height: 400,
      duration: null,
      crossOrigin: true,
      isExample: true,
    },
    b: {
      id: nextId(),
      kind: MediaKind.Video,
      url: { src: VIDEO_SRC, filter: 'saturate(0.55) contrast(1.12)' },
      name: 'ocean_edited.mp4',
      width: 960,
      height: 400,
      duration: null,
      crossOrigin: true,
      isExample: true,
    },
  }
}
