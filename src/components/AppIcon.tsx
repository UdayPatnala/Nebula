/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface AppIconProps {
  className?: string;
  size?: number | string;
}

export function AppIcon({ className = "", size = "100%" }: AppIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-all duration-300`}
    >
      <defs>
        {/* Soft, professional gradients */}
        <linearGradient id="polaroid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" /> {/* Indigo 605 */}
          <stop offset="50%" stopColor="#8b5cf6" /> {/* Purple 500 */}
          <stop offset="100%" stopColor="#ec4899" /> {/* Pink 500 */}
        </linearGradient>
        
        <linearGradient id="neu-network-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" /> {/* Sky 400 */}
          <stop offset="100%" stopColor="#fbbf24" /> {/* Amber 400 */}
        </linearGradient>

        <radialGradient id="glow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Decorative Outer Glow */}
      <circle cx="256" cy="256" r="220" fill="url(#glow-grad)" />

      {/* 1. Polaroid Memory frame wrapper */}
      <rect
        x="96"
        y="64"
        width="320"
        height="384"
        rx="28"
        stroke="url(#polaroid-grad)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.03"
        className="text-slate-800 dark:text-indigo-950/20"
      />
      
      {/* Polaroid bottom horizontal separator */}
      <line
        x1="96"
        y1="360"
        x2="416"
        y2="360"
        stroke="url(#polaroid-grad)"
        strokeWidth="8"
        strokeDasharray="4 8"
        opacity="0.5"
      />

      {/* 2. Stylized Aperture Center */}
      <g transform="translate(256, 212)">
        {/* Inner Aperture Circle Base */}
        <circle
          cx="0"
          cy="0"
          r="84"
          stroke="url(#polaroid-grad)"
          strokeWidth="6"
          fill="none"
          opacity="0.85"
        />

        {/* Aperture Blades (Spiraling lines) */}
        <path d="M 0 -84 L 20 -40 L 72 -42" stroke="url(#polaroid-grad)" strokeWidth="4" opacity="0.6" strokeLinecap="round" />
        <path d="M 72 -42 L 50 10 L 59 60" stroke="url(#polaroid-grad)" strokeWidth="4" opacity="0.6" strokeLinecap="round" />
        <path d="M 59 60 L 0 50 L -42 72" stroke="url(#polaroid-grad)" strokeWidth="4" opacity="0.6" strokeLinecap="round" />
        <path d="M -42 72 L -50 -10 L -80 -25" stroke="url(#polaroid-grad)" strokeWidth="4" opacity="0.6" strokeLinecap="round" />
        <path d="M -80 -25 L -20 -50 L 0 -84" stroke="url(#polaroid-grad)" strokeWidth="4" opacity="0.6" strokeLinecap="round" />

        {/* Center shining core */}
        <circle cx="0" cy="0" r="16" fill="url(#polaroid-grad)" className="animate-pulse" />
      </g>

      {/* 3. Brain/Neural Node Constellation Connections (Radiating outside of polaroid) */}
      {/* Node 1 top-left */}
      <line x1="160" y1="120" x2="210" y2="170" stroke="url(#neu-network-grad)" strokeWidth="4" opacity="0.7" />
      <circle cx="160" cy="120" r="12" fill="#38bdf8" className="animate-pulse" />

      {/* Node 2 top-right */}
      <line x1="352" y1="110" x2="295" y2="160" stroke="url(#neu-network-grad)" strokeWidth="4" opacity="0.7" />
      <circle cx="352" cy="110" r="14" fill="#fbbf24" />
      <circle cx="352" cy="110" r="14" stroke="#fbbf24" strokeWidth="2" fill="none" className="scale-110 animate-ping opacity-35" />

      {/* Node 3 center-left support */}
      <line x1="130" y1="230" x2="180" y2="212" stroke="url(#polaroid-grad)" strokeWidth="3" opacity="0.6" />
      <circle cx="130" cy="230" r="9" fill="#8b5cf6" />

      {/* Node 4 core-right */}
      <line x1="382" y1="225" x2="330" y2="212" stroke="url(#neu-network-grad)" strokeWidth="4" opacity="0.7" id="id_neu_node_4" />
      <circle cx="382" cy="225" r="11" fill="#38bdf8" />

      {/* Node 5 path bottom-left */}
      <line x1="170" y1="310" x2="220" y2="265" stroke="url(#neu-network-grad)" strokeWidth="3.5" opacity="0.6" />
      <circle cx="170" cy="310" r="10" fill="#fbbf24" />

      {/* Node 6 bottom-right anchor */}
      <line x1="340" y1="315" x2="290" y2="265" stroke="url(#polaroid-grad)" strokeWidth="3.5" opacity="0.6" />
      <circle cx="340" cy="315" r="12" fill="#ec4899" />
      <circle cx="340" cy="315" r="12" stroke="#ec4899" strokeWidth="2" fill="none" className="scale-110 animate-ping opacity-30" />

      {/* Indirect interconnections to complete the "Brain Network" */}
      <line x1="160" y1="120" x2="130" y2="230" stroke="url(#polaroid-grad)" strokeWidth="2" opacity="0.4" />
      <line x1="352" y1="110" x2="382" y2="225" stroke="url(#neu-network-grad)" strokeWidth="2" opacity="0.4" />
      <line x1="170" y1="310" x2="340" y2="315" stroke="url(#polaroid-grad)" strokeWidth="2" opacity="0.3.5" />
    </svg>
  );
}
