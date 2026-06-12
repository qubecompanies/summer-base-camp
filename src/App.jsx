import React, { useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth, FIREBASE_READY, MULTI_TENANT } from './firebase'
import { getPlayers, WEEKDAY_QUESTS, WEEKEND_QUESTS, ANCHORS, isQuestHidden } from './config/quests'
import { hasActiveFamily, activeScreenRate } from './config/activeFamily'
import { fmtMins } from './lib/format'
import { sportsByPlayer, getSports, isCustom } from './config/sports'
import { useFamilyState } from './hooks/useFamilyState'
import { useDeviceIdentity } from './hooks/useDeviceIdentity'
import QuestCard from './components/QuestCard'
import SportCard from './components/SportCard'
import DrillSheet from './components/DrillSheet'
import WeekView from './components/WeekView'
import ParentPanel from './components/ParentPanel'
import PinModal from './components/PinModal'
import ProfileSetup from './components/ProfileSetup'
import BoredomBox from './components/BoredomBox'
import CustomCard from './components/CustomCard'
import CustomSheet from './components/CustomSheet'
import LadderSheet from './components/LadderSheet'
import PinSheet from './components/PinSheet'
import ReminderBell from './components/ReminderBell'
import Avatar from './components/Avatar'
import BrothersView from './components/BrothersView'
import AwardSheet from './components/AwardSheet'
import QuestSheet from './components/QuestSheet'
import QuickLogSheet from './components/QuickLogSheet'
import SportsSheet from './components/SportsSheet'
import RewardSheet from './components/RewardSheet'
import Walkthrough from './components/Walkthrough'

export default function App({ onSignOut } = {}) {
  // Under multi-tenant, the shell already established the family session, so the
  // app treats itself as authed (its own anonymous sign-in is skipped below).
  const [authChecked, setAuthChecked] = useState(!FIREBASE_READY || MULTI_TENANT)
  const [authError, setAuthError] = useState(null)
  const [authTry, setAuthTry] = useState(0)
  const [cur, setCur] = useState(() => getPlayers()[0]?.id || 'everett')
  const [view, setView] = useState('today')
  const [mode, setMode] = useState('weekday')
  const [parent, setParent] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [drillFor, setDrillFor] = useState(null)
  const [showCustom, setShowCustom] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [showLadder, setShowLadder] = useState(false)
  const [showPins, setShowPins] = useState(false)
  const [showAward, setShowAward] = useState(false)
  const [showQuests, setShowQuests] = useState(false)
  const [showQuickLog, setShowQuickLog] = useState(false)
  const [showSports, setShowSports] = useState(false)
  const [showRewards, setShowRewards] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [toast, setToast] = useState({ msg: '', show: false })

  const { demo, loading, loadError, teamPoints, teamGoal, milestones, pins, avatars, redeemed, questDefs, state, stats, derived, actions } = useFamilyState()
  const { profile: deviceProfile, bound, bind, unbind } = useDeviceIdentity()
  const isParentDevice = deviceProfile?.role === 'parent'

  // Anonymous sign-in. Critical: we only mark the app "ready" once we actually
  // have a signed-in user — otherwise Firestore reads are denied and the board
  // renders all-zeros with no clue why. A failed sign-in now surfaces a visible,
  // retryable error instead of a silent empty board.
  useEffect(() => {
    // Multi-tenant: the family is already signed in by the shell — don't kick
    // off an anonymous sign-in (it would replace the real session).
    if (!FIREBASE_READY || MULTI_TENANT) return
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { setAuthError(null); setAuthChecked(true) }
    })
    signInAnonymously(auth).catch((e) => {
      console.error('anonymous sign-in failed', e)
      setAuthError(e)
      setAuthChecked(true) // stop the infinite "Loading…" so the error can show
    })
    return unsub
  }, [authTry])

  // A kid-owned device opens straight to that boy's board.
  useEffect(() => {
    if (deviceProfile?.role === 'kid') setCur(deviceProfile.id)
  }, [deviceProfile])

  // First-run: auto-open the walkthrough once on a parent device. Replayable
  // anytime from Manage → App walkthrough.
  useEffect(() => {
    if (deviceProfile?.role !== 'parent') return
    let seen = false
    try { seen = Boolean(localStorage.getItem('sbc_tour_seen')) } catch (_) {}
    if (!seen) setShowTour(true)
  }, [deviceProfile])

  const flash = useCallback((msg) => {
    setToast({ msg, show: true })
    clearTimeout(window._sbc_t)
    window._sbc_t = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000)
  }, [])

  // wrap actions to fire toasts
  const onClaim = (p, q) => { actions.claim(p, q); flash('🟡 Claimed · add proof or get a sign-off') }
  const onRevert = (p, q, note) => { actions.revert(p, q, note); if (note) flash('↩ Sent back with a note') }
  const onProof = async (p, q, file, desc) => { await actions.addProof(p, q, file, desc); flash('✅ 📎 Photo proof in — counts now!') }
  const onDesc = async (p, q, desc) => { await actions.addDesc(p, q, desc); flash('✅ 📝 Description in — counts now!') }
  const onPick = (p, q, pick) => actions.setPick(p, q, pick)
  const onSignOff = (p, q, note) => { actions.signOff(p, q, note); flash('✅ Approved') }
  const onReset = () => { actions.resetToday(); flash('✅ Fresh day — quests reset') }
  const onLogSport = (p, id, opts) => { actions.logSport(p, id, opts); flash('🟡 Practice logged · add proof or get a sign-off') }
  const onLogScreen = (p, m) => { actions.logScreen(p, m); flash(m > 0 ? `📺 Logged ${fmtMins(m)} used` : '↩ Refunded 15m') }
  const onSetLadder = (next) => { actions.setLadder(next); flash('✅ Reward ladder updated') }
  const onSetPin = (id, pin) => { actions.setPin(id, pin); flash('🔑 PIN updated') }
  const onSetAvatar = async (id, file) => { await actions.setAvatar(id, file); flash('📷 Photo updated') }
  const onRedeem = (pts) => { const was = redeemed.includes(pts); actions.redeemMilestone(pts); flash(was ? '↩ Reward un-marked' : '🎁 Reward redeemed!') }
  // Manual parent adjustment (bonus or docking) — auto-counts like an assigned activity.
  const onAward = ({ title, min, pts, targets }) => {
    targets.forEach((pid) => actions.addCustom(pid, { title, min, pts, byParent: true, locked: true }))
    flash(min + pts >= 0 ? '🎁 Bonus applied' : '⚠ Adjustment applied')
  }
  const onSaveQuestDef = (qid, patch) => actions.setQuestDef(qid, patch)
  const onSaveSports = (sports) => { actions.setSports(sports); flash('🎯 Sports updated') }
  const onSaveRate = (rate) => { actions.setScreenRate(rate); flash('📺 Screen-time rate updated') }
  const closeTour = () => { setShowTour(false); try { localStorage.setItem('sbc_tour_seen', '1') } catch (_) {} }
  // Add a custom activity to one or more boys (kid → claim, parent → auto-count).
  const onAddCustom = ({ title, min, pts, targets, byParent }) => {
    targets.forEach((pid) => actions.addCustom(pid, { title, min, pts, byParent }))
    flash(byParent ? '✅ Activity assigned' : '🟡 Custom quest added · get a sign-off')
  }
  // A boy turned an "I'm bored" idea into a claim — small default reward.
  const onLogIdea = (idea) => { actions.addCustom(cur, { title: idea, min: 15, pts: 8 }); flash('🟡 Logged · get a sign-off to count it') }
  // Quick-log a canned chore / quick-win for the current boy (claimed → sign-off).
  const onLogTask = (item, kind) => {
    actions.addCustom(cur, { title: item.title, min: item.min, pts: item.pts, cat: kind, glyph: item.glyph })
    flash(`${item.glyph} Logged · get a sign-off to count it`)
  }
  const onRemoveCustom = (p, id) => { actions.deleteQuest(p, id); flash('🗑 Removed') }

  // ---- auth + identity gate ----
  if (FIREBASE_READY && authError) {
    const code = authError?.code || ''
    const offline = code.includes('network') || (typeof navigator !== 'undefined' && navigator.onLine === false)
    return (
      <div className="loaderr">
        <div className="lecard">
          <div className="leicon">⚠️</div>
          <h2>Couldn’t connect</h2>
          <p>
            {offline
              ? 'Looks like this device is offline. Check your Wi-Fi or cellular signal, then try again.'
              : 'We couldn’t sign in on this device, so the camp data can’t load.'}
          </p>
          <ul className="letips">
            <li>Make sure you’re not in a <b>Private / Incognito</b> tab.</li>
            <li>Open in <b>Safari or Chrome directly</b> (not from inside another app).</li>
            <li>Turn off any <b>ad/content blocker</b> or iCloud <b>Private Relay</b> for this site.</li>
            <li>On iPhone: Settings → Safari → make sure <b>Block All Cookies</b> is off.</li>
          </ul>
          <button className="lebtn" onClick={() => { setAuthError(null); setAuthChecked(false); setAuthTry((n) => n + 1) }}>
            ↻ Try again
          </button>
          {code && <div className="lecode">Error: {code}</div>}
        </div>
      </div>
    )
  }
  if (!authChecked) return <div className="loading">Loading…</div>
  if (!bound) return <ProfileSetup onBind={bind} pins={pins} />

  // `questDefs` is read so this recomputes when a parent hides/edits a quest.
  const quests = (mode === 'weekday' ? WEEKDAY_QUESTS : WEEKEND_QUESTS).filter((q) => !isQuestHidden(q.id))
  void questDefs
  const PLAYERS = getPlayers()
  // Keep the selected kid valid if the family's kids change.
  const curId = PLAYERS.some((p) => p.id === cur) ? cur : (PLAYERS[0]?.id || cur)
  const c = stats[curId] || stats[cur] || { bank: 0, pts: 0, spent: 0, done: 0, pend: 0 }
  const d = derived[curId] || derived[cur] || { streak: 0, weekPoints: {}, weeks: [] }
  const curPlayer = PLAYERS.find((p) => p.id === curId) || PLAYERS[0]
  const customEntries = Object.entries(state[cur]?.quests || {}).filter(([, q]) => isCustom(q))
  const goalPct = Math.min(100, (teamPoints / teamGoal) * 100)

  const handleParentClick = () => {
    if (parent) { setParent(false); return }
    if (isParentDevice) { setParent(true); return } // owner already proved the parent PIN at setup
    setShowPin(true)
  }

  return (
    <div className={`wrap app ${view} ${mode}${parent ? ' parent' : ''}`}>
      {loadError && (
        <div className="loadbanner">
          ⚠️ Couldn’t load the latest data — showing what we have.
          <button onClick={() => window.location.reload()}>↻ Refresh</button>
        </div>
      )}
      {/* top bar */}
      <div className="topbar">
        <div className="brand">
          <div className="badge-sun">☀</div>
          <div>
            <h1>Summer Base Camp</h1>
            <p>Claim it · prove it · earn your screen · build the team goal</p>
          </div>
        </div>
        <div className="topactions">
          <button className={`parent-toggle${parent ? ' on' : ''}`} onClick={handleParentClick}>
            <span className="dot" />Parent
          </button>
          {onSignOut && (
            <button className="signoutbtn" onClick={() => onSignOut()} title="Sign out">⎋</button>
          )}
        </div>
      </div>

      {demo && <div className="demo-banner">Demo mode · add your Firebase keys in .env to save + sync across devices</div>}

      {/* view + mode controls */}
      <div className="viewbar">
        <div className="seg">
          <button className={view === 'today' ? 'on' : ''} onClick={() => setView('today')}>Today</button>
          <button className={view === 'week' ? 'on' : ''} onClick={() => setView('week')}>Week</button>
          {PLAYERS.length >= 2 && (
            <button className={view === 'brothers' ? 'on' : ''} onClick={() => setView('brothers')}>
              {hasActiveFamily() ? 'Team' : 'Brothers'}
            </button>
          )}
        </div>
        <div className="seg">
          <button className={mode === 'weekday' ? 'on' : ''} onClick={() => setMode('weekday')}>Weekday</button>
          <button className={mode === 'weekend' ? 'on' : ''} onClick={() => setMode('weekend')}>Weekend</button>
        </div>
        <span className="modehint">
          {mode === 'weekday' ? 'Mon–Fri · full board, anchors set' : 'Sat–Sun · optional · banks bonus minutes'}
        </span>
      </div>

      {/* players */}
      <div className="players">
        {PLAYERS.map((p) => (
          <div key={p.id} className={`pchip ${p.id}${curId === p.id ? ' active' : ''}`}
               style={p.color ? { borderColor: p.color } : undefined}
               onClick={() => setCur(p.id)}>
            <Avatar className="pav" url={avatars[p.id]} emoji={p.avatar} />
            <div>
              <div className="pname">{p.name}{p.age ? <span className="age"> {p.age}</span> : null}</div>
              <div className="pmeta">{(stats[p.id]?.done ?? 0)} verified · {(stats[p.id]?.pend ?? 0)} pending</div>
            </div>
          </div>
        ))}
      </div>

      {/* HUD */}
      <div className="hud">
        <div className="stat screen">
          <div className="lab">◇ Screen bank</div>
          <div className="val">{fmtMins(c.bank)}</div><div className="sicon">📺</div>
          <div className="sub">screen time left{c.spent > 0 ? ` · ${fmtMins(c.spent)} used` : ''}</div>
        </div>
        <div className="stat pts">
          <div className="lab">◆ Points</div>
          <div className="val">{c.pts}</div><div className="sicon">⭐</div>
          <div className="sub">to the team goal</div>
          {c.pend > 0 && <span className="pendpill">{c.pend} pending sign-off</span>}
        </div>
        <div className="stat streak">
          <div className="lab">▲ Streak</div>
          <div className="val">{d.streak}</div><div className="sicon">🔥</div>
          <div className="sub">weekdays in a row</div>
        </div>
      </div>

      {/* team goal */}
      <div className="team">
        <div className="thead">
          <div>
            <h3>🏕 Team Goal</h3>
            <div className="goalname">Movie → Mini golf → Six Flags → Big adventure</div>
          </div>
          <div className="tcount"><b>{teamPoints}</b><span>/ {teamGoal} pts</span></div>
        </div>
        <div className="bar"><div className="fill" style={{ width: `${goalPct}%` }} /></div>
        <div className="ticks">
          {milestones.map((m) => (
            <div key={m.pts} className={`tick${teamPoints >= m.pts ? ' hit' : ''}${redeemed.includes(m.pts) ? ' redeemed' : ''}`}>
              <b>{m.pts}</b>{m.label}
              {redeemed.includes(m.pts) && <span className="redtag">🎁 redeemed</span>}
            </div>
          ))}
        </div>
      </div>

      {/* WEEK VIEW */}
      {view === 'week' && (
        <WeekView playerName={curPlayer.name} todayPts={c.pts} history={d.weekPoints} weeks={d.weeks} />
      )}

      {/* TEAM / BROTHERS VIEW */}
      {view === 'brothers' && PLAYERS.length >= 2 && (
        <BrothersView stats={stats} derived={derived} avatars={avatars} />
      )}

      {/* TODAY VIEW */}
      {view === 'today' && (
        <>
          {parent && (
            <ParentPanel
              state={state} stats={stats} derived={derived} avatars={avatars}
              teamPoints={teamPoints} milestones={milestones} redeemed={redeemed}
              onSignOff={onSignOff} onRevert={onRevert} onReset={onReset}
              onLogScreen={onLogScreen} onSetAvatar={onSetAvatar} onRedeem={onRedeem}
              onOpenAssign={() => setShowAssign(true)}
              onOpenLadder={() => setShowLadder(true)}
              onOpenPins={() => setShowPins(true)}
              onOpenAward={() => setShowAward(true)}
              onOpenQuests={() => setShowQuests(true)}
              onOpenSports={hasActiveFamily() ? () => setShowSports(true) : undefined}
              onOpenRewards={hasActiveFamily() ? () => setShowRewards(true) : undefined}
              onOpenTour={() => setShowTour(true)}
            />
          )}

          {mode === 'weekend' && (
            <div className="optbanner">
              🌟 <b>Weekend = optional bonus.</b> These quests aren't required and don't break the streak — but every
              verified one <b>pads the screen bank + team points</b>. Do as many or as few as you like.
            </div>
          )}

          <div className="shead">
            <h2>Today's anchors</h2><span className="cnt">a few set times</span><span className="ln" />
          </div>
          <div className="anchors">
            {ANCHORS[mode].map((a, i) => (
              <div className="anchor" key={i}>
                <div className="atime">{a.t}</div>
                <div className="atitle">{a.x}</div>
                <div className="aglyph">{a.g}</div>
              </div>
            ))}
          </div>
          <ReminderBell anchors={ANCHORS[mode]} />

          <div className="shead">
            <h2>{mode === 'weekday' ? 'Quest board' : 'Weekend bonus quests'}</h2>
            <span className="cnt">{c.done} verified · {c.pend} pending</span>
            <span className="ln" />
          </div>
          {c.done === 0 && c.pend === 0 && (
            <div className="emptyhint">
              👋 New here? Tap a card to <b>claim</b> a quest. It counts toward your screen bank once you
              <b> add a photo or a description</b>, or a parent <b>signs off</b>.
            </div>
          )}
          <div className="grid">
            {quests.map((q) => (
              <QuestCard
                key={q.id} quest={q} playerId={cur} mode={mode}
                data={state[cur]?.quests?.[q.id]}
                onClaim={onClaim} onRevert={onRevert} onProof={onProof} onDesc={onDesc} onPick={onPick}
              />
            ))}
          </div>

          <div className="shead" style={{ marginTop: 18 }}>
            <h2>Sports &amp; practice</h2>
            <span className="cnt">effort tiers · 🎯 drills</span><span className="ln" />
          </div>
          <div className="grid">
            {sportsByPlayer(cur).map((s) => (
              <SportCard
                key={s.id} sport={s} playerId={cur}
                data={state[cur]?.quests?.[s.id]}
                onOpenDrills={setDrillFor} onProof={onProof} onDesc={onDesc} onRevert={onRevert}
              />
            ))}
          </div>

          <div className="shead" style={{ marginTop: 18 }}>
            <h2>Your own quests</h2>
            <span className="cnt">make it up · 🎲 beat boredom</span><span className="ln" />
          </div>
          <BoredomBox playerId={cur} onLogIdea={onLogIdea} />
          <div className="grid" style={{ marginTop: 9 }}>
            {customEntries.map(([id, q]) => (
              <CustomCard key={id} playerId={cur} id={id} data={q} onProof={onProof} onDesc={onDesc} onRemove={onRemoveCustom} />
            ))}
            <button className="addcustom quick" onClick={() => setShowQuickLog(true)}>🧹 Log a chore / quick win</button>
            <button className="addcustom" onClick={() => setShowCustom(true)}>＋ Add your own quest</button>
          </div>

          <div className="shead" style={{ marginTop: 18 }}>
            <h2>Badges</h2><span className="cnt">collect 'em</span><span className="ln" />
          </div>
          {[
            { tier: 'short', label: '⚡ Quick wins' },
            { tier: 'medium', label: '📈 Keep it up' },
            { tier: 'long', label: '🎯 Big goals' },
          ].map(({ tier, label }) => {
            const group = d.badges.filter((b) => (b.tier || 'short') === tier)
            if (!group.length) return null
            const got = group.filter((b) => b.got).length
            return (
              <div key={tier} className="badgegroup">
                <div className="bglabel">{label} <span>{got}/{group.length}</span></div>
                <div className="badges">
                  {group.map((b) => {
                    const cur = Math.min(b.cur ?? 0, b.goal)
                    const pct = Math.round((cur / b.goal) * 100)
                    return (
                      <div key={b.n} className={`bg ${b.got ? 'earned' : 'locked'}`}>
                        <div className="ring">{b.e}</div>
                        <div className="binfo">
                          <div className="bn">{b.n}</div>
                          <div className="btip">{b.got ? '✓ earned!' : b.tip}</div>
                          {!b.got && (
                            <div className="bprog">
                              <div className="bbar"><span style={{ width: `${pct}%` }} /></div>
                              <span className="bnum">{cur}/{b.goal}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {d.badges.every((b) => !b.got) && (
            <div className="emptyhint">🔒 No badges yet — verify a few quests and they'll start unlocking.</div>
          )}
        </>
      )}

      <div className="note">
        This device: {deviceProfile.avatar} <b>{deviceProfile.name}</b> ·{' '}
        <b style={{ cursor: 'pointer' }} onClick={() => { setParent(false); unbind() }}>switch profile</b>
        {demo && <> · demo mode — drop Firebase keys into <b>.env</b> to sync across devices</>}
      </div>

      {showPin && (
        <PinModal parentPin={pins.parent} onClose={() => setShowPin(false)}
                  onSuccess={() => { setParent(true); setShowPin(false); setView('today') }} />
      )}

      {drillFor && (
        <DrillSheet sportId={drillFor} playerId={cur} onLog={onLogSport} onClose={() => setDrillFor(null)} />
      )}

      {showCustom && (
        <CustomSheet mode="kid" defaultPlayerId={cur} onAdd={onAddCustom} onClose={() => setShowCustom(false)} />
      )}

      {showAssign && (
        <CustomSheet mode="parent" players={PLAYERS} defaultPlayerId={cur}
                     onAdd={onAddCustom} onClose={() => setShowAssign(false)} />
      )}

      {showLadder && (
        <LadderSheet teamGoal={teamGoal} milestones={milestones} onSave={onSetLadder} onClose={() => setShowLadder(false)} />
      )}

      {showPins && (
        <PinSheet pins={pins} onSave={onSetPin} onClose={() => setShowPins(false)} />
      )}

      {showAward && (
        <AwardSheet players={PLAYERS} defaultPlayerId={cur} onAward={onAward} onClose={() => setShowAward(false)} />
      )}

      {showQuests && (
        <QuestSheet questDefs={questDefs} onSave={onSaveQuestDef} onClose={() => setShowQuests(false)} />
      )}

      {showQuickLog && (
        <QuickLogSheet onLog={onLogTask} onClose={() => setShowQuickLog(false)} />
      )}

      {showSports && (
        <SportsSheet sports={getSports()} kids={PLAYERS} onSave={onSaveSports} onClose={() => setShowSports(false)} />
      )}

      {showRewards && (
        <RewardSheet
          screenRate={activeScreenRate()} onSaveRate={onSaveRate} kids={PLAYERS}
          teamPoints={teamPoints} teamGoal={teamGoal} milestones={milestones}
          recentPerKid={(() => {
            const rates = PLAYERS.map((p) => {
              const wk = (derived[p.id]?.weeks || []).filter((w) => w.total > 0)
              return wk.length ? (wk.reduce((a, w) => a + w.total, 0) / wk.length) / 7 : 0
            }).filter((r) => r > 0)
            return rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0
          })()}
          onClose={() => setShowRewards(false)}
        />
      )}

      {showTour && <Walkthrough onClose={closeTour} />}

      <div className={`toast${toast.show ? ' show' : ''}`} dangerouslySetInnerHTML={{ __html: toast.msg }} />
    </div>
  )
}
