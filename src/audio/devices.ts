/**
 * Preferred audio devices, persisted in localStorage. The recorder applies the
 * mic when capture starts; the player applies the speaker via setSinkId where
 * the browser supports it (Chromium). null = system default.
 */
const MIC_KEY = 'heychat:mic-device'
const SPEAKER_KEY = 'heychat:speaker-device'

export function getPreferredMic(): string | null {
  return localStorage.getItem(MIC_KEY)
}

export function setPreferredMic(deviceId: string | null): void {
  if (deviceId) localStorage.setItem(MIC_KEY, deviceId)
  else localStorage.removeItem(MIC_KEY)
}

export function getPreferredSpeaker(): string | null {
  return localStorage.getItem(SPEAKER_KEY)
}

export function setPreferredSpeaker(deviceId: string | null): void {
  if (deviceId) localStorage.setItem(SPEAKER_KEY, deviceId)
  else localStorage.removeItem(SPEAKER_KEY)
}
