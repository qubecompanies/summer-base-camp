import React, { useState } from 'react'

// Parent-editable reward ladder: the team goal total + each milestone tier.
export default function LadderSheet({ teamGoal, milestones, onSave, onClose }) {
  const [goal, setGoal] = useState(teamGoal)
  const [rows, setRows] = useState(milestones.map((m) => ({ ...m })))

  const setRow = (i, key, val) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: val } : r)))

  const save = () => {
    const cleaned = rows
      .map((r) => ({ pts: Number(r.pts) || 0, label: r.label.trim(), note: (r.note || '').trim() }))
      .filter((r) => r.label && r.pts > 0)
      .sort((a, b) => a.pts - b.pts)
    onSave({ teamGoal: Number(goal) || teamGoal, milestones: cleaned })
    onClose()
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheethead">
          <div className="qmark" style={{ background: 'var(--amber)' }}>🏁</div>
          <div>
            <h3>Edit reward ladder</h3>
            <span>Set the goal total + what each tier unlocks</span>
          </div>
          <button className="x" onClick={onClose}>✕</button>
        </div>

        <div className="fieldlab">Team goal total (pts)</div>
        <input className="textin" type="number" min="1" value={goal} onChange={(e) => setGoal(e.target.value)} />

        <div className="fieldlab">Milestones</div>
        {rows.map((r, i) => (
          <div className="ladderrow" key={i}>
            <input className="textin pts" type="number" min="0" value={r.pts}
                   onChange={(e) => setRow(i, 'pts', e.target.value)} />
            <input className="textin" value={r.label} placeholder="reward"
                   onChange={(e) => setRow(i, 'label', e.target.value)} />
          </div>
        ))}

        <button className="bigbtn" onClick={save}>Save ladder →</button>
      </div>
    </div>
  )
}
