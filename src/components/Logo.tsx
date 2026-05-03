import logoUrl from '../assets/logo.png'

export default function Logo({ width = 260 }: { width?: number }) {
  return <img src={logoUrl} alt="Poké Math" style={{ width, display: 'block' }} />
}
