import React from 'react'

// Renders a player's photo avatar when one is set, else the emoji fallback.
// `className` keeps existing sizing (.pav etc.); `grad` is the emoji backdrop.
export default function Avatar({ url, emoji, className = '', grad, style }) {
  if (url) {
    return (
      <div
        className={`${className} hasphoto`}
        style={{ backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center', ...style }}
        aria-label="avatar"
      />
    )
  }
  return <div className={className} style={{ ...(grad ? { background: grad } : {}), ...style }}>{emoji}</div>
}
