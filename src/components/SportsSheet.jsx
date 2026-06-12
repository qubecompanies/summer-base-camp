import React, { useState } from 'react'
import { STANDARD_SPORTS, TIERS } from '../config/sports'

// Parent-only: configure the family's sports. Pick from a standard catalog or
// create a custom one, assign each to one or more kids, set minutes/points,
// drills, and whether it has "meets". Deuteranopia-safe: glyph + color, never
// color alone. Saves the whole list back to the family doc.
const PALETTE = ['var(--blue)', 'var(--amber)', 'var(--teal)', 'var(--purple)', 'var(--coral)']
const GLYPHS = ['🏀', '⚽', '⚾', '🏈', '🏐', '🎾', '🏊', '🏃', '🏋', '🥋', '🤸', '🩰', '⛳', '🚴', '🧗', '🤼', '🏒', '⛸', '🥍', '🎯']
const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 14) || 'sport'

export default function SportsSheet({ sports = [], kids = [], onSave, onClose }) {
  const [list, setList] = useState(() => sports.map((s) => ({ ...s, owners: [...(s.owners || [])], drills: [...(s.drills || [])] })))
  const [adding, setAdding] = useState(false)
  const [customName, setCustomName] = useState('')

  const usedIds = new Set(list.map((s) => s.id))
  const mkId = (base) => {
    let id = slug(base); let i = 1
    while (usedIds.has(id)) { id = `${slug(base)}${i++}` }
    usedIds.add(id)
    return id
  }

  const update = (id, patch) => setList((l) => l.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const remove = (id) => setList((l) => l.filter((s) => s.id !== id))
  const toggleOwner = (id, kidId) => setList((l) => l.map((s) => {
    if (s.id !== id) return s
    const owners = s.owners.includes(kidId) ? s.owners.filter((k) => k !== kidId) : [...s.owners, kidId]
    return { ...s, owners }
  }))

  const addStandard = (cat) => {
    const color = PALETTE[list.length % PALETTE.length]
    setList((l) => [...l, {
      id: mkId(cat.key), name: cat.name, glyph: cat.glyph, color,
      owners: kids.map((k) => k.id), min: cat.min, pts: cat.pts,
      drills: [...(cat.drills || [])], ...(cat.meetFlag ? { meetFlag: true } : {}),
    }])
    setAdding(false)
  }

  const addCustom = () => {
    const name = customName.trim()
    if (!name) return
    const color = PALETTE[list.length % PALETTE.length]
    setList((l) => [...l, {
      id: mkId(name), name, glyph: '🎯', color, owners: kids.map((k) => k.id),
      min: 30, pts: 16, drills: [],
    }])
    setCustomName('')
    setAdding(false)
  }

  const save = () => {
    // Clean: drop sports with no name or no owners, coerce numbers.
    const clean = list
      .map((s) => ({
        ...s,
        name: (s.name || '').trim(),
        min: Math.max(0, Number(s.min) || 0),
        pts: Math.max(0, Number(s.pts) || 0),
        drills: (s.drills || []).map((d) => d.trim()).filter(Boolean),
      }))
      .filter((s) => s.name && s.owners.length)
    onSave(clean)
    onClose()
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="card sportsheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 26 }}>🎯</div>
        <h2>Sports &amp; practice</h2>
        <p>Pick standard sports or make your own. Assign each to a kid, set the reward, and edit drills. Effort tiers ({TIERS.map((t) => t.label).join(' · ')}) scale the reward when they log a session.</p>

        <div className="spslist">
          {list.length === 0 && <div className="spsempty">No sports yet — add one below.</div>}
          {list.map((s) => (
            <div className="spscard" key={s.id} style={{ borderColor: s.color }}>
              <div className="spshead">
                <select className="spsglyph" value={s.glyph} onChange={(e) => update(s.id, { glyph: e.target.value })} aria-label="icon">
                  {GLYPHS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <input className="spsname" value={s.name} onChange={(e) => update(s.id, { name: e.target.value })} placeholder="Sport name" />
                <button className="spsx" onClick={() => remove(s.id)} aria-label="remove">✕</button>
              </div>

              <div className="spsowners">
                <span className="spslab">Who:</span>
                {kids.map((k) => (
                  <button key={k.id} className={`spschip${s.owners.includes(k.id) ? ' on' : ''}`} onClick={() => toggleOwner(s.id, k.id)}>
                    {k.avatar} {k.name}
                  </button>
                ))}
              </div>

              <div className="spsrow">
                <label className="spsfield"><span>📺 Minutes</span>
                  <input type="number" min={0} value={s.min} onChange={(e) => update(s.id, { min: e.target.value })} />
                </label>
                <label className="spsfield"><span>⭐ Points</span>
                  <input type="number" min={0} value={s.pts} onChange={(e) => update(s.id, { pts: e.target.value })} />
                </label>
                <label className="spsmeet">
                  <input type="checkbox" checked={Boolean(s.meetFlag)} onChange={(e) => update(s.id, { meetFlag: e.target.checked })} />
                  🏁 Has meets
                </label>
              </div>

              <label className="spsfield drills"><span>🎯 Drills (one per line)</span>
                <textarea rows={3} value={(s.drills || []).join('\n')}
                  onChange={(e) => update(s.id, { drills: e.target.value.split('\n') })}
                  placeholder={'Shooting · 50 makes\nConditioning sprints'} />
              </label>
            </div>
          ))}
        </div>

        {adding ? (
          <div className="spsadd">
            <div className="spslab">Standard sports</div>
            <div className="spscatalog">
              {STANDARD_SPORTS.map((c) => (
                <button key={c.key} className="spscat" onClick={() => addStandard(c)}>
                  <span className="spscatg">{c.glyph}</span>{c.name}
                </button>
              ))}
            </div>
            <div className="spslab" style={{ marginTop: 10 }}>Or create your own</div>
            <div className="spscustom">
              <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Custom sport name" />
              <button className="qbtn proof submit" disabled={!customName.trim()} onClick={addCustom}>＋ Add</button>
            </div>
            <button className="spscancel" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        ) : (
          <button className="spsaddbtn" onClick={() => setAdding(true)}>＋ Add a sport</button>
        )}

        <div className="spsactions">
          <button className="bigbtn" style={{ background: 'var(--cream)', color: 'var(--ink-soft)' }} onClick={onClose}>Cancel</button>
          <button className="bigbtn" style={{ background: 'var(--blue)', color: '#fff' }} onClick={save}>Save sports</button>
        </div>
      </div>
    </div>
  )
}
