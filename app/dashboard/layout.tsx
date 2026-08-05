'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggleButton } from '@/lib/use-theme'

const navItems = [
  { href: '/dashboard',            icon: '📊', label: 'Dashboard'     },
  { href: '/dashboard/forecasts',  icon: '🧠', label: 'Prévisions IA' },
  { href: '/dashboard/stocks',     icon: '📦', label: 'Stocks'        },
  { href: '/dashboard/orders',     icon: '🛒', label: 'Commandes'     },
  { href: '/dashboard/reputation', icon: '⭐', label: 'Réputation'    },
  { href: '/dashboard/social',        icon: '📲', label: 'Social Media'     },
  { href: '/dashboard/social-media', icon: '🤖', label: 'Social Media IA' },
  { href: '/dashboard/fidelisation',icon:'♥',  label: 'Fidélisation'  },
  { href: '/dashboard/admin',  icon:'⚙️', label: 'Admin Panel'  },
  { href: '/dashboard/import', icon:'📥', label: 'Import CSV'   },
]

// Module "Gestion du restaurant" (Lot 1 MVP) — section séparée, affichée
// indépendamment du split Principal/Croissance existant (basé sur des index
// fixes qui casseraient si on insérait des éléments au milieu du tableau
// ci-dessus).
const restaurantNavItems = [
  { href: '/dashboard/restaurant/overview', icon: '🏪', label: 'Pilotage restaurant' },
  { href: '/dashboard/restaurant/orders',   icon: '🧾', label: 'Commandes (v2)'      },
  { href: '/dashboard/restaurant/kds',      icon: '🔥', label: 'Écran cuisine'       },
  { href: '/dashboard/restaurant/menus',    icon: '🍔', label: 'Menus et produits'   },
  { href: '/dashboard/restaurant/recipes',   icon: '📋', label: 'Recettes et marges'     },
  { href: '/dashboard/restaurant/stocks',    icon: '📦', label: 'Stocks (v2)'            },
  { href: '/dashboard/restaurant/purchases', icon: '🚚', label: 'Achats et fournisseurs' },
  { href: '/dashboard/restaurant/staff',     icon: '👥', label: 'Équipe et planning'      },
  { href: '/dashboard/restaurant/disputes',  icon: '⚖️', label: 'Litiges'                 },
  { href: '/dashboard/restaurant/finance',   icon: '💰', label: 'Finance et TVA'           },
  { href: '/dashboard/restaurant/copilot',   icon: '🧠', label: 'Copilote IA'              },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [user, setUser]     = useState<any>(null)
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('nr_user='))
    if (!cookie) { router.push('/login'); return }
    try { setUser(JSON.parse(decodeURIComponent(cookie.split('=')[1]))) } catch(e) { router.push('/login') }
  }, [])

  function logout() {
    document.cookie = 'nr_token=; path=/; max-age=0'
    document.cookie = 'nr_user=; path=/; max-age=0'
    router.push('/login')
  }

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) || 'NR'

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg-page)' }}>
      {/* SIDEBAR */}
      <aside style={{ width:220, background:'var(--bg-sidebar)', borderRight:'1px solid var(--border-color)', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, zIndex:50 }}>
        {/* Logo */}
        <div style={{ padding:'20px 16px', borderBottom:'1px solid var(--border-color)' }}>
          <div style={{ fontSize:20, fontWeight:800 }}>Nover<span style={{ color:'var(--accent)' }}>Resto</span></div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2, textTransform:'uppercase', letterSpacing:1 }}>v1.2.0</div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 0', overflowY:'auto' }}>
          <div style={{ fontSize:9, color:'var(--text-muted)', padding:'0 16px 8px', textTransform:'uppercase', letterSpacing:1 }}>Principal</div>
          {navItems.slice(0,5).map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                display:'flex', alignItems:'center', gap:10, padding:'9px 16px',
                fontSize:13, color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                background: active ? 'var(--bg-card)' : 'transparent',
                borderLeft: `3px solid ${active ? 'var(--accent)' : 'transparent'}`,
                textDecoration:'none', fontWeight: active ? 600 : 400,
                transition:'all .15s'
              }}>
                <span>{item.icon}</span>{item.label}
              </Link>
            )
          })}
          <div style={{ fontSize:9, color:'var(--text-muted)', padding:'12px 16px 8px', textTransform:'uppercase', letterSpacing:1 }}>Croissance</div>
          {navItems.slice(5).map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                display:'flex', alignItems:'center', gap:10, padding:'9px 16px',
                fontSize:13, color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                background: active ? 'var(--bg-card)' : 'transparent',
                borderLeft: `3px solid ${active ? 'var(--accent)' : 'transparent'}`,
                textDecoration:'none', fontWeight: active ? 600 : 400,
                transition:'all .15s'
              }}>
                <span>{item.icon}</span>{item.label}
              </Link>
            )
          })}

          <div style={{ fontSize:9, color:'var(--text-muted)', padding:'12px 16px 8px', textTransform:'uppercase', letterSpacing:1 }}>Gestion du restaurant</div>
          {restaurantNavItems.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                display:'flex', alignItems:'center', gap:10, padding:'9px 16px',
                fontSize:13, color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                background: active ? 'var(--bg-card)' : 'transparent',
                borderLeft: `3px solid ${active ? 'var(--accent)' : 'transparent'}`,
                textDecoration:'none', fontWeight: active ? 600 : 400,
                transition:'all .15s'
              }}>
                <span>{item.icon}</span>{item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ padding:'14px 16px', borderTop:'1px solid var(--border-color)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'var(--bg-page)', flexShrink:0 }}>{initials}</div>
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontSize:12, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name || '...'}</div>
              <div style={{ fontSize:10, color:'var(--accent)', textTransform:'uppercase', letterSpacing:.5 }}>{user?.role || 'client'}</div>
            </div>
          </div>
          <button onClick={logout} style={{ width:'100%', padding:'7px', background:'var(--border-color)', border:'none', borderRadius:7, color:'var(--text-secondary)', fontSize:12, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, marginLeft:220, minHeight:'100vh', overflow:'auto' }}>
        {/* Topbar */}
        <div style={{ background:'var(--bg-sidebar)', borderBottom:'1px solid var(--border-color)', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:40 }}>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <ThemeToggleButton />
            <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent)' }}></div>
            <span style={{ fontSize:12, color:'var(--accent)', fontWeight:600 }}>Burger House · Lac Tunis</span>
          </div>
        </div>
        {/* Content */}
        <div style={{ padding:24 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
