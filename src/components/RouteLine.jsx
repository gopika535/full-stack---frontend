import React from 'react'

export default function RouteLine({ from = 'Source', to = 'Destination' }) {
  return (
    <div className="route-animated-card">
      <div className="route-header">
        <div className="route-point source">
          <span className="pin-marker">📍</span>
          <span className="point-name">{from}</span>
        </div>
        <div className="route-point dest">
          <span className="point-name">{to}</span>
          <span className="pin-marker">🚩</span>
        </div>
      </div>

      <div className="route-svg-wrap">
        <svg viewBox="0 0 320 100" className="route-s-curve" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Arrowhead marker matching user's uploaded image */}
            <marker
              id="routeArrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#facc15" />
            </marker>
          </defs>

          {/* Background Glow Path */}
          <path
            d="M 30 30 C 130 5, 170 95, 285 70"
            fill="none"
            stroke="rgba(250, 204, 21, 0.25)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* S-Curved Dotted Line ending with Arrow */}
          <path
            d="M 30 30 C 130 5, 170 95, 285 70"
            fill="none"
            stroke="#facc15"
            strokeWidth="3.5"
            strokeDasharray="6 6"
            strokeLinecap="round"
            markerEnd="url(#routeArrow)"
          />

          {/* Flipped Bus Emoji (facing FORWARD right) moving in SLOW MOTION (8.5s) */}
          <g>
            <text
              fontSize="24"
              textAnchor="middle"
              dominantBaseline="central"
              transform="scale(-1, 1)"
            >
              🚌
            </text>
            <animateMotion
              path="M 30 30 C 130 5, 170 95, 285 70"
              dur="8.5s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </g>
        </svg>
      </div>
    </div>
  )
}

