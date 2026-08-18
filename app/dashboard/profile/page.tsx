'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

const C = { teal:'var(--accent)', red:'var(--danger)', muted:'var(--text-muted)', gray:'var(--text-secondary)', navyD:'var(--bg-page)', navyM:'var(--bg-card)', navyL:'var(--border-color)' }

function getToken() {
  return document.cookie.split(';').find(c => c.trim().startsWith('nr_token='))?.split('=')[1] || ''
}

// Met a jour le cookie nr_user (source de verite pour la sidebar/topbar)
// apres un changement de profil, sans obliger l'utilisateur a se
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
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [restaurant, setRestaurant] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [passwordChanged, setPasswordChanged] = useState(false)

  useEffect(() => {
    const token = getToken()
    api.me(token).then(d => {
      setUser(d.user)
      setName(d.user.name || '')
      setRestaurant(d.user.restaurant || '')
      setAddress(d.user.address || '')
      setCity(d.user.city || '')
      setPostalCode(d.user.postal_code || '')
      setLogoUrl(d.user.logo_url || '')
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
      const d = await api.updateProfile(getToken(), {
        name: name.trim(), restaurant: restaurant.trim(),
        address: address.trim(), city: city.trim(), postal_code: postalCode.trim(), logo_url: logoUrl.trim()
      })
      setUser(d.user)
      patchUserCookie({ name: d.user.name, restaurant: d.user.restaurant, logo_url: d.user.logo_url })
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
      setPasswordChanged(true)
      setPasswordMsg({ type: 'ok', text: 'Mot de passe changé. Votre session actuelle est invalidée par sécurité — reconnexion dans 3 secondes...' })
      // Le token en cours devient invalide des ce changement (verifie par
      // authMiddleware cote API) : on deconnecte proprement plutot que de
      // laisser l'utilisateur avec une session qui echouera au prochain clic.
      setTimeout(() => {
        document.cookie = 'nr_token=; path=/; max-age=0'
        document.cookie = 'nr_user=; path=/; max-age=0'
        router.push('/login')
      }, 3000)
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
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
        Informations du compte et sécurité
        {user?.last_login_at && <> · dernière connexion le {new Date(user.last_login_at).toLocaleString('fr-FR')}</>}
      </div>

      {/* Informations */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Informations</div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--bg-page)', border: `1px solid ${C.navyL}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
            ) : (
              <span style={{ fontSize: 24 }}>🏪</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>URL du logo</label>
            <input style={inp} value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Collez le lien d'une image déjà en ligne (pas d'upload de fichier pour l'instant)</div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={label}>Email</label>
          <input style={{ ...inp, opacity: .6, cursor: 'not-allowed' }} value={user?.email || ''} disabled />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={label}>Nom</label>
          <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={label}>Restaurant</label>
          <input style={inp} value={restaurant} onChange={e => setRestaurant(e.target.value)} placeholder="Nom du restaurant" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={label}>Adresse</label>
          <input style={inp} value={address} onChange={e => setAddress(e.target.value)} placeholder="12 rue de la République" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={label}>Ville</label>
            <input style={inp} value={city} onChange={e => setCity(e.target.value)} placeholder="Tunis" />
          </div>
          <div>
            <label style={label}>Code postal</label>
            <input style={inp} value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="1000" />
          </div>
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
          <input type="password" style={inp} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} disabled={passwordChanged} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={label}>Nouveau mot de passe</label>
          <input type="password" style={inp} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="8 caractères minimum" disabled={passwordChanged} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Confirmer le nouveau mot de passe</label>
          <input type="password" style={inp} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={passwordChanged} />
        </div>

        {passwordMsg && (
          <div style={{ fontSize: 12, color: passwordMsg.type === 'ok' ? 'var(--success)' : C.red, marginBottom: 12 }}>
            {passwordMsg.type === 'ok' ? '✅ ' : '⚠️ '}{passwordMsg.text}
          </div>
        )}

        <button onClick={savePassword} disabled={savingPassword || passwordChanged || !currentPassword || !newPassword} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: (savingPassword || passwordChanged || !currentPassword || !newPassword) ? C.navyL : C.teal, color: (savingPassword || passwordChanged || !currentPassword || !newPassword) ? C.muted : C.navyD, fontSize: 13, fontWeight: 700, cursor: (savingPassword || passwordChanged || !currentPassword || !newPassword) ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif' }}>
          {savingPassword ? '⟳ Changement...' : passwordChanged ? '✅ Mot de passe changé' : '🔑 Changer le mot de passe'}
        </button>
      </div>
    </div>
  )
}
