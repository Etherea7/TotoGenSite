'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX } from 'lucide-react'
import { soundManager } from '@/lib/sound-manager'

export function SoundToggle() {
  const [muted, setMuted] = useState(soundManager.isMuted())

  const handleToggle = () => {
    const newMuted = soundManager.toggleMute()
    setMuted(newMuted)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handleToggle}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {muted ? (
        <VolumeX className="w-4 h-4 text-muted-foreground" />
      ) : (
        <Volume2 className="w-4 h-4 text-muted-foreground" />
      )}
    </Button>
  )
}
