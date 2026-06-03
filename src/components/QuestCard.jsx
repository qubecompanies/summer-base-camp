import React, { useRef, useState } from 'react'
import { resolveQuest } from '../config/quests'
import { fmtMins } from '../lib/format'

const isVerified = (s) => s === 'proof' || s === 'approved'

export default function QuestCard({ quest, playerId, mode, data, onClaim, onRevert, onProof, onDesc, onPick }) {
  const q = resolveQuest(quest, playerId)
  const status = data?.status || 'open'
  const pick = data?.pick
  const proofUrl = data?.proofUrl
  const savedDesc = data?.desc
  const note = data?.note
  const [showIdeas, setShowIdeas] = useState(false)
  const [justDone, setJustDone] = useState(false)
  const [desc, setDesc] = useState(savedDesc || '')
  const fileRef = useRef(null)

  const cardClick = () => {
    if (status === 'open') {
      setJustDone(true)
      setTimeout(() => setJustDone(false), 350)
      onClaim(playerId, q.id)
    } else {
      onRevert(playerId, q.id)
    }
  }

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (f) onProof(playerId, q.id, f, desc)
    e.target.value = ''
  }

  const stop = (e) => e.stopPropagation()

  return (
    <div
      className={`quest ${status}${quest.bonus ? ' bonus' : ''}${justDone ? ' justdone' : ''}`}
      onClick={cardClick}
    >
      <div className="qcheck">{isVerified(status) ? '✓' : status === 'claimed' ? '…' : ''}</div>

      <div className="qtop">
        <div className="qmark" style={{ background: q.color }}>{q.glyph}</div>
        <div>
          <div className="qtitle">{q.title}</div>
          <div className="qcat">
            {q.cat}{quest.bonus ? ' · bonus' : ''}{mode === 'weekend' ? ' · optional' : ''}
          </div>
          {pick && <div className="qpick">focus: {pick}</div>}
        </div>
      </div>

      <div className="qrewards">
        <span className="rw min">+{fmtMins(q.min)} screen</span>
        <span className="rw pt">+{q.pts} pts</span>
      </div>

      {proofUrl && (
        <div className="proofthumb">
          <img src={proofUrl} alt="proof" />
          <span>photo attached ✓</span>
        </div>
      )}

      {savedDesc && status !== 'claimed' && <div className="qdesc" onClick={stop}>📝 “{savedDesc}”</div>}

      {note && <div className={`qnote${status === 'approved' ? ' ok' : ''}`} onClick={stop}>💬 {note}</div>}

      {status === 'claimed' && (
        <div className="proofpanel" onClick={stop}>
          <textarea className="descin" rows={2} value={desc}
                    placeholder="Tell us what you did (counts as proof)…"
                    onChange={(e) => setDesc(e.target.value)} />
          <button className="qbtn proof submit" disabled={!desc.trim()}
                  onClick={() => onDesc(playerId, q.id, desc)}>✓ Submit description</button>
        </div>
      )}

      <div className="qfoot" onClick={stop}>
        {status === 'open' && (
          <button className="qbtn" onClick={() => setShowIdeas((v) => !v)}>💡 ideas</button>
        )}
        {status === 'claimed' && (
          <>
            <span className="statustag wait">⏳ awaiting sign-off</span>
            <button className="qbtn proof" onClick={() => fileRef.current?.click()}>📎 Add photo proof</button>
          </>
        )}
        {status === 'proof' && <span className="statustag ok">📎 proof added</span>}
        {status === 'approved' && <span className="statustag ok">✓ signed off</span>}
        {status !== 'open' && (
          <button className="qbtn" onClick={() => setShowIdeas((v) => !v)}>💡</button>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment"
               style={{ display: 'none' }} onChange={handleFile} />
      </div>

      {showIdeas && (
        <div className="ideas" onClick={stop}>
          <span className="ihl">💡 ideas for {q.cat}</span>
          {(q.ideas || []).map((idea) => (
            <span key={idea} className="chip" onClick={() => { onPick(playerId, q.id, idea); setShowIdeas(false) }}>
              {idea}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
