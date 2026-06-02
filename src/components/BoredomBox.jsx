import React, { useState } from 'react'
import { rollBoredom } from '../config/boredom'

// "I'm bored" spinner. Rolls a quick screen-free thing to do; a boy can turn
// the rolled idea into a custom activity claim (needs a sign-off to count).
export default function BoredomBox({ playerId, onLogIdea }) {
  const [idea, setIdea] = useState('')

  const roll = () => setIdea(rollBoredom(playerId, idea))

  return (
    <div className="boredom">
      <div className="boredhead">
        <span className="bdice">🎲</span>
        <div>
          <b>Bored? Spin it.</b>
          <small>A quick no-screen thing to do right now.</small>
        </div>
      </div>

      {idea && <div className="boredidea">{idea}</div>}

      <div className="boredacts">
        <button className="bigbtn alt" onClick={roll}>{idea ? '↻ Spin again' : '🎲 Spin'}</button>
        {idea && (
          <button className="bigbtn" onClick={() => { onLogIdea(idea); setIdea('') }}>
            ✓ I did it → log it
          </button>
        )}
      </div>
    </div>
  )
}
