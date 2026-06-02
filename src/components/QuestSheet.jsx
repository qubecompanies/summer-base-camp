import React from 'react'
import { WEEKDAY_QUESTS, WEEKEND_QUESTS } from '../config/quests'

// Parent-only: edit the built-in quest board (title / minutes / points) and hide
// quests you don't use. Edits live in Firestore `questDefs` and override the
// shipped defaults everywhere — board, point math, and sign-off values.
function QuestRow({ q, def, onSave }) {
  const title = def.title ?? q.title
  const min = def.min ?? q.min
  const pts = def.pts ?? q.pts
  const hidden = Boolean(def.hidden)
  return (
    <div className={`qedrow${hidden ? ' hidden' : ''}`}>
      <div className="qedmark" style={{ background: q.color }}>{q.glyph}</div>
      <div className="qedfields">
        <input className="textin" value={title} onChange={(e) => onSave(q.id, { title: e.target.value })} />
        <div className="qednums">
          <label>min<input className="textin" type="number" min="0" value={min}
                           onChange={(e) => onSave(q.id, { min: Number(e.target.value) || 0 })} /></label>
          <label>pts<input className="textin" type="number" min="0" value={pts}
                           onChange={(e) => onSave(q.id, { pts: Number(e.target.value) || 0 })} /></label>
          <button className={`qedhide${hidden ? ' on' : ''}`} onClick={() => onSave(q.id, { hidden: !hidden })}>
            {hidden ? '🚫 hidden' : '👁 shown'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function QuestSheet({ questDefs = {}, onSave, onClose }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="sheet wide" onClick={(e) => e.stopPropagation()}>
        <div className="sheethead">
          <div className="qmark" style={{ background: 'var(--blue)' }}>✎</div>
          <div>
            <h3>Edit the quest board</h3>
            <span>Change titles, minutes, points — or hide ones you skip</span>
          </div>
          <button className="x" onClick={onClose}>✕</button>
        </div>

        <div className="fieldlab">Weekday quests</div>
        {WEEKDAY_QUESTS.map((q) => (
          <QuestRow key={q.id} q={q} def={questDefs[q.id] || {}} onSave={onSave} />
        ))}

        <div className="fieldlab" style={{ marginTop: 12 }}>Weekend quests</div>
        {WEEKEND_QUESTS.map((q) => (
          <QuestRow key={q.id} q={q} def={questDefs[q.id] || {}} onSave={onSave} />
        ))}

        <button className="bigbtn" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}
