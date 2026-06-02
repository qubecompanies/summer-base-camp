import React, { useState } from 'react'
import { CHORE_LIBRARY, QUICK_WINS } from '../config/tasks'
import { fmtMins } from '../lib/format'

// One-tap menu of canned chores + quick wins. Each tap logs that item as its
// own entry (claimed → needs a sign-off), so a boy can log several in one day.
// The sheet stays open and tallies what's been logged this session.
function Row({ item, kind, count, onLog }) {
  return (
    <div className={`qlrow${count ? ' done' : ''}`}>
      <div className="qlglyph">{item.glyph}</div>
      <div className="qlinfo">
        <div className="qltitle">{item.title}</div>
        <div className="qlval">+{fmtMins(item.min)} · +{item.pts} pts{count ? ` · ✓ logged ×${count}` : ''}</div>
      </div>
      <button className="qllog" onClick={() => onLog(item, kind)}>＋ Log</button>
    </div>
  )
}

export default function QuickLogSheet({ onLog, onClose }) {
  const [counts, setCounts] = useState({})
  const log = (item, kind) => {
    onLog(item, kind)
    setCounts((c) => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }))
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="sheet wide" onClick={(e) => e.stopPropagation()}>
        <div className="sheethead">
          <div className="qmark" style={{ background: 'var(--teal)' }}>🧹</div>
          <div>
            <h3>Log a chore or quick win</h3>
            <span>Tap as many as you did — each needs a sign-off to count</span>
          </div>
          <button className="x" onClick={onClose}>✕</button>
        </div>

        <div className="fieldlab">Chores</div>
        {CHORE_LIBRARY.map((item) => (
          <Row key={item.id} item={item} kind="Chore" count={counts[item.id] || 0} onLog={log} />
        ))}

        <div className="fieldlab" style={{ marginTop: 12 }}>Quick wins</div>
        {QUICK_WINS.map((item) => (
          <Row key={item.id} item={item} kind="Quick win" count={counts[item.id] || 0} onLog={log} />
        ))}

        <button className="bigbtn" onClick={onClose}>
          {total > 0 ? `Done — logged ${total}` : 'Done'}
        </button>
      </div>
    </div>
  )
}
