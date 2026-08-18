'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const C = { teal:'var(--accent)', red:'var(--danger)', muted:'var(--text-muted)', gray:'var(--text-secondary)', navyD:'var(--bg-page)', navyM:'var(--bg-card)', navyL:'var(--border-color)' }

function getToken() {
  return document.cookie.split(';').find(c => c.trim().startsWith('nr_token='))?.split('=')[1] || ''
}

// Met a jour le cookie nr_user (source de verite pour la sidebar/topbar)
// apres un changement de nom/restaurant, sans obliger l'utilisateur a se
// reconnecter pour voir son propre changement pris en compte.
function patchUserCookie(patch: Record<string, any>) {
  const raw = document.cookie.split(';').find(c => c.trim().startsWith('nr_user='))
  if (!raw) return
  try {
    const current = JSON.parse(decodeURIComponent(raw.split('=')[1]))
    const updated = { ...current, ...patch }
    document.cookie = `nr_user=${encodeURIComponent(JSON.stringify(updated))}; path=/; max-age=${7 * 24 * 3600}`
  } catch {}
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [restaurant, setRestaurant] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const token = getToken()
    api.me(token).then(d => {
      setUser(d.user)
      setName(d.user.name || '')
      setRestaurant(d.user.restaurant || '')
    }).finally(() => setLoading(false))
  }, [])

  async function saveProfile() {
    setProfileMsg(null)
    if (!name.trim() || !restaurant.trim()) {
      setProfileMsg({ type: 'error', text: 'Le nom et le nom du restaurant sont requis' })
      return
    }
    setSavingProfile(true)
    try {
      const d = await api.updateProfile(getToken(), { name: name.trim(), restaurant: restaurant.trim() })
      setUser(d.user)
      patchUserCookie({ name: d.user.name, restaurant: d.user.restaurant })
      setProfileMsg({ type: 'ok', text: 'Profil mis à jour.' })
    } catch (e: any) {
      setProfileMsg({ type: 'error', text: e.message })
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword() {
    setPasswordMsg(null)
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Le nouveau mot de passe doit faire au moins 8 caractères' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Les deux mots de passe ne correspondent pas' })
      return
    }
    setSavingPassword(true)
    try {
      await api.changePassword(getToken(), currentPassword, newPassword)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setPasswordMsg({ type: 'ok', text: 'Mot de passe changé avec succès.' })
    } catch (e: any) {
      setPasswordMsg({ type: 'error', text: e.message })
    } finally {
      setSavingPassword(false)
    }
  }

  const inp = { width: '100%', background: 'var(--bg-page)', border: `1px solid ${C.navyL}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box' as any }
  const label = { fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }
  const card = { background: C.navyM, border: `1px solid ${C.navyL}`, borderRadius: 14, padding: 24, marginBottom: 20 }

  if (loading) return <div style={{ color: C.muted, padding: 40 }}>Chargement...</div>

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', marginBottom: 4 }}>👤 Mon <span style={{ color: C.teal }}>profil</span></h1>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Informations du compte et sécurité</div>

      {/* Informations */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Informations</div>

        <div style={{ marginBottom: 12 }}>
          <label style={label}>Email</label>
          <input style={{ ...inp, opacity: .6, cursor: 'not-allowed' }} value={user?.email || ''} disabled />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={label}>Nom</label>
          <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={label}>Restaurant</label>
          <input style={inp} value={restaurant} onChange={e => setRestaurant(e.target.value)} placeholder="Nom du restaurant" />
        </div>

        {profileMsg && (
          <div style={{ fontSize: 12, color: profileMsg.type === 'ok' ? 'var(--success)' : C.red, marginBottom: 12 }}>
            {profileMsg.type === 'ok' ? '✅ ' : '⚠️ '}{profileMsg.text}
          </div>
        )}

        <button onClick={saveProfile} disabled={savingProfile} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: savingProfile ? C.navyL : C.teal, color: savingProfile ? C.muted : C.navyD, fontSize: 13, fontWeight: 700, cursor: savingProfile ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif' }}>
          {savingProfile ? '⟳ Sauvegarde...' : '💾 Enregistrer'}
        </button>
      </div>

      {/* Mot de passe */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>🔒 Changer le mot de passe</div>

        <div style={{ marginBottom: 12 }}>
          <label style={label}>Mot de passe actuel</label>
          <input type="password" style={inp} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={label}>Nouveau mot de passe</label>
          <input type="password" style={inp} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="8 caractères minimum" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Confirmer le nouveau mot de passe</label>
          <input type="password" style={inp} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        </div>

        {passwordMsg && (
          <div style={{ fontSize: 12, color: passwordMsg.type === 'ok' ? 'var(--success)' : C.red, marginBottom: 12 }}>
            {passwordMsg.type === 'ok' ? '✅ ' : '⚠️ '}{passwordMsg.text}
          </div>
        )}

        <button onClick={savePassword} disabled={savingPassword || !currentPassword || !newPassword} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: (savingPassword || !currentPassword || !newPassword) ? C.navyL : C.teal, color: (savingPassword || !currentPassword || !newPassword) ? C.muted : C.navyD, fontSize: 13, fontWeight: 700, cursor: (savingPassword || !currentPassword || !newPassword) ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif' }}>
          {savingPassword ? '⟳ Changement...' : '🔑 Changer le mot de passe'}
        </button>
      </div>
    </div>
  )
}
