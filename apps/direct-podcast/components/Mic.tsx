import React from 'react'

type Props = {
  className?: string
  viewBox?: string
  volumeLevel?: number // 0-1 range for volume level
}

const Mic: React.FC<Props> = ({
  className,
  viewBox = '0 0 24 24',
  volumeLevel = 0,
}) => {
  // Generate a unique ID for this instance
  const [gradientId] = React.useState(
    () => `mic-gradient-${Math.random().toString(36).substring(2, 11)}`,
  )

  // Clamp volume level between 0 and 1
  const clampedVolume = Math.max(0, Math.min(1, volumeLevel))
  // Calculate the gradient stop percentage (inverted because gradient goes top to bottom)
  const fillPercentage = (1 - clampedVolume) * 100

  // Calculate color based on volume level (green to red)
  const hue = (1 - clampedVolume) * 120 // 120 = green, 0 = red
  const fillColor = `hsl(${hue}, 70%, 50%)`
  const unfillColor = `hsl(${hue}, 70%, 50%)`

  return (
    <svg width='100%' viewBox={viewBox} className={className}>
      <defs>
        <linearGradient id={gradientId} x1='0%' y1='0%' x2='0%' y2='100%'>
          <stop
            offset={`${fillPercentage}%`}
            style={{ stopColor: unfillColor, stopOpacity: 0.3 }}
          />
          <stop
            offset={`${fillPercentage}%`}
            style={{ stopColor: fillColor, stopOpacity: 1 }}
          />
        </linearGradient>
      </defs>
      <path
        d='M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z'
        fill={`url(#${gradientId})`}
      />
    </svg>
  )
}

export default Mic
