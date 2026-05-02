import Logo from '../components/Logo'
import './TitleScreen.css'

interface Props {
  onNewGame: () => void
}

export default function TitleScreen({ onNewGame }: Props) {
  return (
    <div className="title-screen">
      <div className="title-screen__inner">
        <Logo width={280} />
        <p className="title-screen__tagline">A math adventure for Valentine</p>
        <button className="btn btn-primary btn-lg" onClick={onNewGame}>
          ▶ New Game
        </button>
      </div>
    </div>
  )
}
