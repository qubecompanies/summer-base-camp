import React, { useState, useEffect, useRef } from 'react'
import {
  notifySupported, requestNotifyPermission, scheduleAnchorReminders, upcomingAnchorCount,
} from '../lib/reminders'

const KEY = 'sbc_reminders_on'

// Per-device toggle that schedules today's anchor reminders. Honest about the
// limit: these fire while the app is open/backgrounded, not when fully closed.
export default function ReminderBell({ anchors }) {
  const [on, setOn] = useState(() => localStorage.getItem(KEY) === '1')
  const [perm, setPerm] = useState(notifySupported() ? Notification.permission : 'unsupported')
  const cancelRef = useRef(null)

  // (Re)schedule whenever enabled + anchors change; tear down on cleanup.
  useEffect(() => {
    cancelRef.current?.()
    cancelRef.current = null
    if (on && perm === 'granted') cancelRef.current = scheduleAnchorReminders(anchors)
    return () => cancelRef.current?.()
  }, [on, perm, anchors])

  if (!notifySupported()) return null

  const toggle = async () => {
    if (on) { setOn(false); localStorage.setItem(KEY, '0'); return }
    const result = await requestNotifyPermission()
    setPerm(result)
    if (result === 'granted') {
      setOn(true); localStorage.setItem(KEY, '1')
    }
  }

  const upcoming = upcomingAnchorCount(anchors)

  return (
    <div className={`reminderbell${on ? ' on' : ''}`}>
      <button className="rbtoggle" onClick={toggle}>
        <span className="rbicon">{on ? '🔔' : '🔕'}</span>
        {on ? 'Anchor reminders on' : 'Remind me at anchor times'}
      </button>
      <small>
        {perm === 'denied'
          ? 'Notifications are blocked — turn them on for this site in your browser settings.'
          : on
            ? `${upcoming} more today · fires while the app stays open or in the background (phones can't alert when it's fully closed).`
            : 'Get a nudge at each anchor time. Works while the app is open or backgrounded.'}
      </small>
    </div>
  )
}
