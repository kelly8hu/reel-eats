import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { supabase } from '../lib/supabase.js'
import BottomNav from '../components/BottomNav.js'

export default function Profile() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [pantryInput, setPantryInput] = useState('')
  const [pantryItems, setPantryItems] = useState<string[]>([])

  const email = session?.user?.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  function addPantryItem() {
    const item = pantryInput.trim()
    if (!item || pantryItems.includes(item)) return
    setPantryItems([...pantryItems, item])
    setPantryInput('')
  }

  function removePantryItem(item: string) {
    setPantryItems(pantryItems.filter((i) => i !== item))
  }

  return (
    <div className="page">
      <div className="page-header px">
        <h1>My <span className="logo-dot">Profile</span></h1>
      </div>

      <div className="px stack stack-lg">
        {/* Avatar + email */}
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="profile-avatar">{initials}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 15 }}>{email}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Reel Eats member</p>
          </div>
        </div>

        {/* Sign out */}
        <button className="btn btn-secondary btn-full" onClick={() => void signOut()}>
          Sign out
        </button>

        {/* Pantry */}
        <div className="stack stack-sm">
          <div>
            <p className="section-label">🥦 My Pantry</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Add ingredients you have at home. Coming soon: filter recipes by what's in your pantry.
            </p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); addPantryItem() }}
            style={{ display: 'flex', gap: 8 }}
          >
            <input
              className="input"
              placeholder="e.g. olive oil, garlic…"
              value={pantryInput}
              onChange={(e) => setPantryInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 18px' }}>
              Add
            </button>
          </form>

          {pantryItems.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <p>No pantry items yet.</p>
            </div>
          ) : (
            <div className="stack stack-sm">
              {pantryItems.map((item) => (
                <div key={item} className="pantry-item card">
                  <span>{item}</span>
                  <button className="pantry-remove" onClick={() => removePantryItem(item)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
