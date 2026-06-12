import React from 'react'

// Privacy policy + terms of use. Plain-language, family-app appropriate. This is
// a practical starting template, not legal advice — have it reviewed before any
// wide public launch. Contact email is configurable via VITE_SUPPORT_EMAIL.
const CONTACT = import.meta.env.VITE_SUPPORT_EMAIL || 'philipeaker@gmail.com'

export default function LegalSheet({ onClose }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="card legalsheet" onClick={(e) => e.stopPropagation()}>
        <h2>Privacy &amp; Terms</h2>
        <p className="legalupd">Summer Base Camp · a free family tool · last updated June 2026</p>

        <h3>Privacy</h3>
        <ul>
          <li><b>What we store:</b> the parent’s sign-in email, your family name, each kid’s first name and chosen emoji/photo, any “proof” photos your family uploads, activity and points data, and the 4-digit PINs you set.</li>
          <li><b>How it’s used:</b> only to run the app for your family. We don’t sell your data, show ads, or share it with anyone. No third-party tracking.</li>
          <li><b>Where it lives:</b> Google Firebase (authentication, database, file storage). Each family’s data is isolated from every other family.</li>
          <li><b>Children:</b> the app is set up and managed by a parent or guardian, who provides consent for their own children. Please don’t add another person’s child’s name or photo without that parent’s permission.</li>
          <li><b>Your control:</b> you can edit or remove kids, photos, and your family at any time in the app. To delete your family and all its data entirely, email <b>{CONTACT}</b>.</li>
          <li><b>Security note:</b> the PINs are light in-app gates so kids can’t impersonate each other — not strong security. Don’t store anything sensitive.</li>
        </ul>

        <h3>Terms of use</h3>
        <ul>
          <li>Provided free and “as-is,” with no warranty and no guarantee of uptime or that data won’t be lost.</li>
          <li>You’re responsible for what your family uploads. Don’t upload illegal, harmful, or inappropriate content. We may remove content or accounts that break this.</li>
          <li>Access is invite-only — please don’t share your access beyond the people it’s meant for.</li>
          <li>Accounts are managed by an adult (18+) on behalf of their household.</li>
          <li>We may update these terms; continued use means you accept the changes.</li>
          <li>Questions or data requests: <b>{CONTACT}</b>.</li>
        </ul>

        <button className="bigbtn" style={{ background: 'var(--blue)', color: '#fff' }} onClick={onClose}>Got it</button>
      </div>
    </div>
  )
}
