import chuvaNaJanela from '../assets/lofi-covers/01-chuva-na-janela.svg'
import luaCheia from '../assets/lofi-covers/02-lua-cheia.svg'
import gatoNoParapeito from '../assets/lofi-covers/03-gato-no-parapeito.svg'
import cafeELivros from '../assets/lofi-covers/04-cafe-e-livros.svg'
import vinil from '../assets/lofi-covers/05-vinil.svg'
import fitaCassete from '../assets/lofi-covers/06-fita-cassete.svg'
import luminariaDeMesa from '../assets/lofi-covers/07-luminaria-de-mesa.svg'
import porDoSolPraia from '../assets/lofi-covers/08-por-do-sol-praia.svg'
import tremNoturno from '../assets/lofi-covers/09-trem-noturno.svg'
import cerejeiras from '../assets/lofi-covers/10-cerejeiras.svg'
import montanhas from '../assets/lofi-covers/11-montanhas.svg'
import fogueira from '../assets/lofi-covers/12-fogueira.svg'
import radioAntigo from '../assets/lofi-covers/13-radio-antigo.svg'
import aquario from '../assets/lofi-covers/14-aquario.svg'
import neveNaJanela from '../assets/lofi-covers/15-neve-na-janela.svg'
import neonDaCidade from '../assets/lofi-covers/16-neon-da-cidade.svg'
import terraco from '../assets/lofi-covers/17-terraco.svg'
import quartoAconchegante from '../assets/lofi-covers/18-quarto-aconchegante.svg'
import nuvensSonhadoras from '../assets/lofi-covers/19-nuvens-sonhadoras.svg'
import estacaoDeOnibus from '../assets/lofi-covers/20-estacao-de-onibus.svg'
import violao from '../assets/lofi-covers/21-violao.svg'
import jardimChuvoso from '../assets/lofi-covers/22-jardim-chuvoso.svg'
import telaRetro from '../assets/lofi-covers/23-tela-retro.svg'
import cadernoDeEsbocos from '../assets/lofi-covers/24-caderno-de-esbocos.svg'

export interface LofiTrackMeta {
  title: string
  /** Caminho público do arquivo (servido de `public/audio/lofi/`, ver vite.config.ts). */
  src: string
  credit: string
  /** Capa ilustrada (uma por faixa, `src/assets/lofi-covers/`) exibida no player em vez do ícone genérico. */
  cover: string
}

/**
 * 24 faixas lo-fi reais (licença Pixabay Content License — uso livre, atribuição não obrigatória,
 * crédito exibido mesmo assim por transparência com quem ouve), arquivos em
 * `public/audio/lofi/<arquivo>`, baixados manualmente de https://pixabay.com/pt/music/search/lofi/
 * (US-57 RN-01 — débito do README resolvido para lo-fi; o ambiente sonoro continua como placeholder).
 */
export const LOFI_TRACKS: readonly LofiTrackMeta[] = [
  {
    title: 'Lofi Reel',
    src: '/audio/lofi/zephiramusic-lofi-reel-588906.mp3',
    credit: 'ZephiraMusic · Pixabay',
    cover: terraco,
  },
  {
    title: 'Lofi Chill Vlog Beats',
    src: '/audio/lofi/alex-morgan-lofi-chill-vlog-beats-573883.mp3',
    credit: 'alex-morgan · Pixabay',
    cover: montanhas,
  },
  {
    title: 'Lofi Soul',
    src: '/audio/lofi/zephiramusic-lofi-soul-588903.mp3',
    credit: 'ZephiraMusic · Pixabay',
    cover: fogueira,
  },
  {
    title: 'Lofi Relaxing',
    src: '/audio/lofi/velariomusic-lofi-relaxing-598427.mp3',
    credit: 'VelarioMusic · Pixabay',
    cover: nuvensSonhadoras,
  },
  {
    title: 'Late Night Stacks',
    src: '/audio/lofi/ornave-lofi-late-night-stacks-553416.mp3',
    credit: 'Ornave · Pixabay',
    cover: tremNoturno,
  },
  {
    title: 'Positive Lofi',
    src: '/audio/lofi/zephiramusic-positive-lofi-587548.mp3',
    credit: 'ZephiraMusic · Pixabay',
    cover: porDoSolPraia,
  },
  {
    title: 'Lofi Calm',
    src: '/audio/lofi/velariomusic-lofi-calm-596422.mp3',
    credit: 'VelarioMusic · Pixabay',
    cover: aquario,
  },
  {
    title: 'Worn Keys',
    src: '/audio/lofi/ornave-lofi-worn-keys-594983.mp3',
    credit: 'Ornave · Pixabay',
    cover: radioAntigo,
  },
  {
    title: 'Beautiful Lofi',
    src: '/audio/lofi/zephiramusic-beautiful-lofi-603162.mp3',
    credit: 'ZephiraMusic · Pixabay',
    cover: cerejeiras,
  },
  {
    title: 'Corporate Lofi Groove',
    src: '/audio/lofi/alex-morgan-corporate-lofi-groove-advertising-560068.mp3',
    credit: 'alex-morgan · Pixabay',
    cover: estacaoDeOnibus,
  },
  {
    title: 'Chillhop Jazz Coffee Shop',
    src: '/audio/lofi/alex-morgan-chillhop-jazz-coffee-shop-552792.mp3',
    credit: 'alex-morgan · Pixabay',
    cover: cafeELivros,
  },
  {
    title: 'Open Window',
    src: '/audio/lofi/ornave-lofi-open-window-553420.mp3',
    credit: 'Ornave · Pixabay',
    cover: chuvaNaJanela,
  },
  {
    title: 'Vinyl Teapot',
    src: '/audio/lofi/ornave-lofi-vinyl-teapot-553356.mp3',
    credit: 'Ornave · Pixabay',
    cover: vinil,
  },
  {
    title: 'Rainy Night Rhythm',
    src: '/audio/lofi/alex-morgan-lofi-hip-hop-rhythm-rainy-night-560050.mp3',
    credit: 'alex-morgan · Pixabay',
    cover: jardimChuvoso,
  },
  {
    title: 'Lofi Study',
    src: '/audio/lofi/fassounds-lofi-study-calm-peaceful-chill-hop-112191.mp3',
    credit: 'FASSounds · Pixabay',
    cover: cadernoDeEsbocos,
  },
  {
    title: 'Moon Light',
    src: '/audio/lofi/ornave-lofi-moon-light-553399.mp3',
    credit: 'Ornave · Pixabay',
    cover: luaCheia,
  },
  {
    title: 'Lofi Night',
    src: '/audio/lofi/pulsebox-lofi-night-522890.mp3',
    credit: 'Pulsebox · Pixabay',
    cover: neonDaCidade,
  },
  {
    title: 'Corporate Lofi Flute Presentation',
    src: '/audio/lofi/alex-morgan-corporate-lofi-flute-presentation-560069.mp3',
    credit: 'alex-morgan · Pixabay',
    cover: quartoAconchegante,
  },
  {
    title: 'Coffee Lofi Chill Ambient',
    src: '/audio/lofi/lofi_music_library-coffee-lofi-chill-lofi-ambient-458901.mp3',
    credit: 'Lofi Music Library · Pixabay',
    cover: gatoNoParapeito,
  },
  {
    title: 'Lofi Lullaby',
    src: '/audio/lofi/marlowemusic-lofi-lullaby-581721.mp3',
    credit: 'MarloweMusic · Pixabay',
    cover: neveNaJanela,
  },
  {
    title: 'Lofi Jazz',
    src: '/audio/lofi/velariomusic-lofi-jazz-596980.mp3',
    credit: 'VelarioMusic · Pixabay',
    cover: violao,
  },
  {
    title: 'Nostalgic Lofi',
    src: '/audio/lofi/zephiramusic-nostalgic-lofi-587549.mp3',
    credit: 'ZephiraMusic · Pixabay',
    cover: fitaCassete,
  },
  {
    title: 'Lofi Chill Background Music',
    src: '/audio/lofi/aventure-lofi-chill-background-music-508269.mp3',
    credit: 'Aventure · Pixabay',
    cover: telaRetro,
  },
  {
    title: "Elm's Sunny Desk (Piano Lofi)",
    src: '/audio/lofi/turning_pages-elmx27s-sunny-desk-piano-lofi-462747.mp3',
    credit: 'Turning Pages · Pixabay',
    cover: luminariaDeMesa,
  },
]
