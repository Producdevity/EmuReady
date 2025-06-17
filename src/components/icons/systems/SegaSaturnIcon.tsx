function SegaSaturnIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      x="0"
      y="0"
      width="100"
      height="100"
      viewBox="0 0 400 400"
    >
      <title>Sega Saturn</title>
      <g>
        <circle
          cx="200"
          cy="200"
          r="180"
          fill="url(#saturnGradient)"
          stroke="#1e4e9f"
          strokeWidth="4"
        />
        <defs>
          <radialGradient id="saturnGradient" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#e1e7f2" />
            <stop offset="50%" stopColor="#88a1cc" />
            <stop offset="80%" stopColor="#476eb0" />
            <stop offset="100%" stopColor="#1e4e9f" />
          </radialGradient>
        </defs>

        {/* Saturn's iconic ring */}
        <ellipse
          cx="200"
          cy="200"
          rx="280"
          ry="80"
          fill="none"
          stroke="#1e4e9f"
          strokeWidth="12"
          opacity="0.8"
        />

        {/* Inner ring for depth */}
        <ellipse
          cx="200"
          cy="200"
          rx="260"
          ry="65"
          fill="none"
          stroke="#476eb0"
          strokeWidth="6"
          opacity="0.6"
        />

        {/* Shadow on the planet for the ring */}
        <ellipse
          cx="200"
          cy="200"
          rx="140"
          ry="40"
          fill="#1e4e9f"
          opacity="0.3"
        />
      </g>
    </svg>
  )
}

export default SegaSaturnIcon
