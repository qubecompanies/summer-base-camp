import React, { useState } from 'react'

// "Create your family" onboarding (multi-tenant, flag-gated). Collects the
// family name, the kids, a team goal, and PINs, then calls createFamily().
// Deuteranopia-safe: each kid gets a palette color AND a distinct emoji, and
// nothing relies on color alone.
const PALETTE = ['var(--blue)', 'var(--amber)', 'var(--teal)', 'var(--purple)', 'var(--coral)']
const AV = ['🧭', '🌊', '🚀', '🦊', '🐢', '⚡', '🌟', '🦉', '🎒', '🛹']

const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12) || 'kid'
const blankKid = (i) => ({ name: '', avatar: AV[i % AV.length], pin: String(i + 1).repeat(4).slice(0, 4) })

export default function CreateFamily({ user, onCreate }) {
  const [name, setName] = useState('')
  const [teamGoal, setTeamGoal] = useState(6000)
  const [parentPin, setParentPin] = useState('1234')
  const [kids, setKids] = useState([blankKid(0), blankKid(1)])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const setKid = (i, patch) => setKids((ks) => ks.map((k, j) => (j === i ? { ...k, ...patch } : k)))
  const addKid = () => setKids((ks) => (ks.length >= 6 ? ks : [...ks, blankKid(ks.length)]))
  const removeKid = (i) => setKids((ks) => (ks.length <= 1 ? ks : ks.filter((_, j) => j !== i)))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const named = kids.map((k) => ({ ...k, name: k.name.trim() })).filter((k) => k.name)
    if (!named.length) { setError('Add at least one kid.'); return }
    if (!/^\d{4}$/.test(parentPin)) { setError('Parent PIN must be 4 digits.'); return }
    for (const k of named) {
      if (!/^\d{4}$/.test(k.pin)) { setError(`${k.name}'s PIN must be 4 digits.`); return }
    }
    // Build unique kid ids (slug + index if collision) and the pins map.
    const seen = {}
    const finalKids = named.map((k, i) => {
      let id = slug(k.name)
      if (seen[id]) id = `${id}${i}`
      seen[id] = true
      return { id, name: k.name, avatar: k.avatar, color: PALETTE[i % PALETTE.length] }
    })
    const pins = { parent: parentPin }
    finalKids.forEach((k, i) => { pins[k.id] = named[i].pin })

    setBusy(true)
    try {
      await onCreate(user.uid, {
        name: name.trim() || 'My Family',
        kids: finalKids,
        teamGoal: Number(teamGoal) || 6000,
        pins,
      })
      // On success, useFamily flips to 'ready' and the app advances.
    } catch (err) {
      setError(err?.code || err?.message || 'Could not create the family. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="signin">
      <div className="sicard wide">
        <div className="sibrand">
          <div className="badge-sun">☀</div>
          <div>
            <h1>Create your family</h1>
            <p>Set up your camp · you can change all of this later</p>
          </div>
        </div>

        <form onSubmit={submit} className="siform">
          <label className="sifield">
            <span>🏡 Family name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="The Smith Family" />
          </label>

          <div className="sifield">
            <span>🧒 Kids</span>
            <div className="cfkids">
              {kids.map((k, i) => (
                <div className="cfkid" key={i}>
                  <select className="cfav" value={k.avatar} onChange={(e) => setKid(i, { avatar: e.target.value })} aria-label="avatar">
                    {AV.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <input className="cfname" value={k.name} onChange={(e) => setKid(i, { name: e.target.value })} placeholder={`Kid ${i + 1} name`} />
                  <input className="cfpin" value={k.pin} onChange={(e) => setKid(i, { pin: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="PIN" inputMode="numeric" />
                  {kids.length > 1 && <button type="button" className="cfx" onClick={() => removeKid(i)} aria-label="remove">✕</button>}
                </div>
              ))}
            </div>
            {kids.length < 6 && <button type="button" className="cfadd" onClick={addKid}>＋ Add another kid</button>}
          </div>

          <div className="cfrow">
            <label className="sifield">
              <span>🎯 Team goal (points)</span>
              <input type="number" min={100} step={100} value={teamGoal} onChange={(e) => setTeamGoal(e.target.value)} />
            </label>
            <label className="sifield">
              <span>🔑 Parent PIN</span>
              <input value={parentPin} onChange={(e) => setParentPin(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="4 digits" />
            </label>
          </div>

          {error && <div className="simsg err">⚠ {error}</div>}

          <button className="sibtn" type="submit" disabled={busy}>
            {busy ? 'Creating…' : '✦ Create family & start camp'}
          </button>
        </form>

        <p className="sifoot">Kids share this one login · their PIN picks their board.</p>
      </div>
    </div>
  )
}
