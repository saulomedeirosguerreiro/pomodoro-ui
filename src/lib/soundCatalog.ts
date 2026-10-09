import type { AmbientTrackId } from './settings'

export interface AmbientTrackMeta {
  id: AmbientTrackId
  label: string
}

/** G-Q15: 3 ambientes previstos — sem arquivo real ainda (débito documentado no README, US-64). */
export const AMBIENT_TRACKS: readonly AmbientTrackMeta[] = [
  { id: 'chuva', label: 'Chuva suave' },
  { id: 'cafeteria', label: 'Cafeteria' },
  { id: 'passaros', label: 'Pássaros' },
]

export interface LofiTrackMeta {
  title: string
  /** Caminho público do arquivo (servido de `public/audio/lofi/`, ver vite.config.ts). */
  src: string
  credit: string
}

/**
 * 19 faixas lo-fi reais (licença Pixabay Content License — uso livre, atribuição não obrigatória,
 * crédito exibido mesmo assim por transparência com quem ouve), arquivos em
 * `public/audio/lofi/<arquivo>`, baixados manualmente de https://pixabay.com/pt/music/search/lofi/
 * (US-57 RN-01 — débito do README resolvido para lo-fi; o ambiente sonoro continua como placeholder).
 */
export const LOFI_TRACKS: readonly LofiTrackMeta[] = [
  { title: 'Lofi Reel', src: '/audio/lofi/zephiramusic-lofi-reel-588906.mp3', credit: 'ZephiraMusic · Pixabay' },
  {
    title: 'Lofi Chill Vlog Beats',
    src: '/audio/lofi/alex-morgan-lofi-chill-vlog-beats-573883.mp3',
    credit: 'alex-morgan · Pixabay',
  },
  { title: 'Lofi Soul', src: '/audio/lofi/zephiramusic-lofi-soul-588903.mp3', credit: 'ZephiraMusic · Pixabay' },
  {
    title: 'Lofi Relaxing',
    src: '/audio/lofi/velariomusic-lofi-relaxing-598427.mp3',
    credit: 'VelarioMusic · Pixabay',
  },
  { title: 'Lofi Music', src: '/audio/lofi/prettyjohn1-lofi-lofi-music-587176.mp3', credit: 'prettyjohn1 · Pixabay' },
  {
    title: 'Late Night Stacks',
    src: '/audio/lofi/ornave-lofi-late-night-stacks-553416.mp3',
    credit: 'Ornave · Pixabay',
  },
  { title: 'Positive Lofi', src: '/audio/lofi/zephiramusic-positive-lofi-587548.mp3', credit: 'ZephiraMusic · Pixabay' },
  { title: 'Lofi Calm', src: '/audio/lofi/velariomusic-lofi-calm-596422.mp3', credit: 'VelarioMusic · Pixabay' },
  {
    title: 'Lofi Music (curta)',
    src: '/audio/lofi/prettyjohn1-lofi-lofi-music_61sec-587180.mp3',
    credit: 'prettyjohn1 · Pixabay',
  },
  { title: 'Worn Keys', src: '/audio/lofi/ornave-lofi-worn-keys-594983.mp3', credit: 'Ornave · Pixabay' },
  {
    title: 'Beautiful Lofi',
    src: '/audio/lofi/zephiramusic-beautiful-lofi-603162.mp3',
    credit: 'ZephiraMusic · Pixabay',
  },
  {
    title: 'Corporate Lofi Groove',
    src: '/audio/lofi/alex-morgan-corporate-lofi-groove-advertising-560068.mp3',
    credit: 'alex-morgan · Pixabay',
  },
  {
    title: 'Chillhop Jazz Coffee Shop',
    src: '/audio/lofi/alex-morgan-chillhop-jazz-coffee-shop-552792.mp3',
    credit: 'alex-morgan · Pixabay',
  },
  { title: 'Open Window', src: '/audio/lofi/ornave-lofi-open-window-553420.mp3', credit: 'Ornave · Pixabay' },
  { title: 'Vinyl Teapot', src: '/audio/lofi/ornave-lofi-vinyl-teapot-553356.mp3', credit: 'Ornave · Pixabay' },
  {
    title: 'Rainy Night Rhythm',
    src: '/audio/lofi/alex-morgan-lofi-hip-hop-rhythm-rainy-night-560050.mp3',
    credit: 'alex-morgan · Pixabay',
  },
  {
    title: 'Lofi Study',
    src: '/audio/lofi/fassounds-lofi-study-calm-peaceful-chill-hop-112191.mp3',
    credit: 'FASSounds · Pixabay',
  },
  { title: 'Moon Light', src: '/audio/lofi/ornave-lofi-moon-light-553399.mp3', credit: 'Ornave · Pixabay' },
  { title: 'Lofi Night', src: '/audio/lofi/pulsebox-lofi-night-522890.mp3', credit: 'Pulsebox · Pixabay' },
]
