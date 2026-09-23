import { useSyncExternalStore } from 'react'
import { subscribeSaveStatus, getLastSaveFailed } from '../store/localStorage'
import './SaveErrorBanner.css'

/** Shown on every screen while the most recent save attempt has failed */
export default function SaveErrorBanner() {
  const saveFailed = useSyncExternalStore(subscribeSaveStatus, getLastSaveFailed)
  if (!saveFailed) return null
  return (
    <div className="save-error-banner" role="alert">
      ⚠️ Your progress couldn’t be saved — this browser’s storage is full or blocked.
      Keep this tab open; the game will keep trying to save.
    </div>
  )
}
