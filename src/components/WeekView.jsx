import React from 'react'

// Build the current week's Mon..Sun day descriptors.
function weekDays() {
  const now = new Date()
  const dow = (now.getDay() + 6) % 7 // 0 = Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() - dow)
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return names.map((n, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      n,
      dt: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      wknd: i >= 5,
      isToday: d.toDateString() === now.toDateString(),
    }
  })
}

export default function WeekView({ playerName, todayPts, history, weeks = [] }) {
  const days = weekDays()
  let weekTotal = 0
  const cells = days.map((d) => {
    // history is an optional map { 'Mon': pts, ... }; today uses live pts.
    const pts = d.isToday ? todayPts : (history?.[d.n] ?? 0)
    weekTotal += pts
    let ring = ''
    if (pts >= 80) ring = 'full'
    else if (pts > 0) ring = 'part'
    return { ...d, pts, ring }
  })

  return (
    <div>
      <div className="shead">
        <h2>This week · {playerName}</h2>
        <span className="cnt">{weekTotal} pts this week</span>
        <span className="ln" />
      </div>
      <div className="weekgrid">
        {cells.map((c) => (
          <div key={c.n} className={`wday${c.wknd ? ' wknd' : ''}${c.isToday ? ' today' : ''}`}>
            <div className="wn">{c.n}</div>
            <div className="wdt">{c.dt}</div>
            <div className={`wring ${c.ring}`}>{c.pts || '·'}</div>
            {c.wknd ? <div className="wopt">optional</div> : <div className="wpts">{c.isToday ? 'today' : 'pts'}</div>}
          </div>
        ))}
      </div>
      <div className="weeknote">
        Weekdays carry the streak. <b>Weekends are optional</b> — anything done Sat/Sun
        <b> banks extra screen minutes and points</b> on top of the weekday total. No pressure, just bonus.
      </div>

      {weeks.length > 1 && (() => {
        const peak = Math.max(1, ...weeks.map((w) => w.total))
        const best = Math.max(...weeks.map((w) => w.total))
        return (
          <>
            <div className="shead" style={{ marginTop: 18 }}>
              <h2>Last {weeks.length} weeks</h2>
              <span className="cnt">week of · pts</span>
              <span className="ln" />
            </div>
            <div className="trend">
              {weeks.map((w) => (
                <div key={w.label} className={`tcol${w.isCurrent ? ' cur' : ''}`}>
                  <div className="tval">{w.total}</div>
                  <div className="tbarwrap">
                    <div
                      className={`tbar${w.total === best && best > 0 ? ' peak' : ''}`}
                      style={{ height: `${Math.round((w.total / peak) * 100)}%` }}
                    />
                  </div>
                  <div className="tlab">{w.isCurrent ? 'now' : w.label}</div>
                </div>
              ))}
            </div>
          </>
        )
      })()}
    </div>
  )
}
