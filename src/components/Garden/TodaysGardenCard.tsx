import { speciesForIndex } from '../../lib/gardenSpecies'
import styles from './TodaysGardenCard.module.css'

interface TodaysGardenCardProps {
  maturedCount: number
  isGrowing: boolean
}

export function TodaysGardenCard({ maturedCount, isGrowing }: TodaysGardenCardProps) {
  const matured = Array.from({ length: maturedCount }, (_, index) => speciesForIndex(index))

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2>🌱 Jardim de Foco de Hoje</h2>
        <span className={styles.count}>{maturedCount} colheitas</span>
      </div>
      <p className={styles.tagline}>Cada sessão completada faz florescer um amigo no seu canteiro!</p>

      {matured.length === 0 && !isGrowing ? (
        <p className={styles.empty}>Seu canteiro está esperando a primeira semente de hoje.</p>
      ) : (
        <div className={styles.grid}>
          {matured.map((species, index) => (
            <div key={index} className={styles.plant}>
              <span className={styles.plantEmoji} aria-hidden="true">
                {species.emoji}
              </span>
              <span className={styles.plantName}>{species.name}</span>
              <span className={styles.plantStatus}>Maduro (25m)</span>
            </div>
          ))}
          {isGrowing && (
            <div className={`${styles.plant} ${styles.growing}`}>
              <span className={styles.plantEmoji} aria-hidden="true">
                🌱
              </span>
              <span className={styles.plantName}>Semente</span>
              <span className={styles.plantStatus}>Brotando</span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
