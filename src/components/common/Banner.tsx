import styles from './Banner.module.css'

export function Banner({ kind, message }: { kind: 'error' | 'success'; message: string }) {
  return (
    <p className={`${styles.banner} ${kind === 'error' ? styles.error : styles.success}`} role="status">
      {message}
    </p>
  )
}
