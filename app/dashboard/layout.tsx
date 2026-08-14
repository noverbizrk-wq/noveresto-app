'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggleButton } from '@/lib/use-theme'
import { api } from '@/lib/api'

interface NavItem {
  href: string
  icon: string
  label: string
  key?: string
  adminOnly?: boolean
}

interface NavCategory {
  id: string
  label: string
  icon: string
  items: NavItem[]
}

const navCategories: NavCategory[] = [
  {
    id: 'overview', label: 'Vue d\'ensemble', icon: '📊',
    items: [
      { href: '/dashboard', icon: '📊', label: 'Dashboard' },
      { href: '/dashboard/restaurant/overview', icon: '🏪', label: 'Pilotage restaurant', key: 'overview' },
      { href: '/dashboard/forecasts', icon: '🧠', label: 'Prévisions IA' },
    ],
  },
  {
    id: 'operations', label: 'Opérations', icon: '🍔',
    items: [
      { href: '/dashboard/restaurant/orders', icon: '🧾', label: 'Commandes', key: 'orders' },
      { href: '/dashboard/restaurant/kds', icon: '🔥', label: 'Écran cuisine', key: 'kds' },
      { href: '/dashboard/restaurant/menus', icon: '🍔', label: 'Menus et produits', key: 'menus' },
      { href: '/dashboard/restaurant/recipes', icon: '📋', label: 'Recettes et marges', key: 'recipes' },
      { href: '/dashboard/restaurant/stocks', icon: '📦', label: 'Stocks', key: 'stocks' },
      { href: '/dashboard/restaurant/purchases', icon: '🚚', label: 'Achats et fournisseurs', key: 'purchases' },
      { href: '/dashboard/restaurant/staff', icon: '👥', label: 'Équipe et planning', key: 'staff' },
      { href: '/dashboard/restaurant/disputes', icon: '⚖️', label: 'Litiges', key: 'disputes' },
    ],
  },
  {
    id: 'finance', label: 'Finance', icon: '💰',
    items: [
      { href: '/dashboard/restaurant/finance', icon: '💰', label: 'Finance et TVA', key: 'finance' },
    ],
  },
  {
    id: 'croissance', label: 'Croissance', icon: '📈',
    items: [
      { href: '/dashboard/reputation', icon: '⭐', label: 'Réputation' },
      { href: '/dashboard/restaurant/prospection', icon: '🎯', label: 'Prospection', key: 'prospection' },
      { href: '/dashboard/social', icon: '📲', label: 'Social Media' },
      { href: '/dashboard/social-media', icon: '🤖', label: 'Social Media IA' },
      { href: '/dashboard/fidelisation', icon: '♥', label: 'Fidélisation' },
    ],
  },
  {
    id: 'ia', label: 'IA', icon: '🤖',
    items: [
      { href: '/dashboard/restaurant/copilot', icon: '🧠', label: 'Copilote IA', key: 'copilot' },
    ],
  },
  {
    id: 'admin', label: 'Administration', icon: '⚙️',
    items: [
      { href: '/dashboard/admin', icon: '⚙️', label: 'Admin Panel' },
      { href: '/dashboard/admin/module-access', icon: '🔐', label: 'Gestion des accès', adminOnly: true },
      { href: '/dashboard/import', icon: '📥', label: 'Import CSV' },
    ],
  },
]

const STORAGE_KEY = 'nr_sidebar_open_categories'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const [user, setUser]     = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [myModules, setMyModules] = useState<string[] | null>(null)
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(navCategories.map(c => c.id)))
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setOpenCategories(new Set(JSON.parse(saved)))
    } catch {}
  }, [])

  useEffect(() => {
    const activeCategory = navCategories.find(c => c.items.some(i => i.href === pathname))
    if (activeCategory) {
      setOpenCategories(prev => {
        if (prev.has(activeCategory.id)) return prev
        const next = new Set(prev)
        next.add(activeCategory.id)
        return next
      })
    }
  }, [pathname])

  function toggleCategory(id: string) {
    setOpenCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  useEffect(() => {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('nr_user='))
    if (!cookie) { router.push('/login'); return }
    try { setUser(JSON.parse(decodeURIComponent(cookie.split('=')[1]))) } catch(e) { router.push('/login') }

    const tokenCookie = document.cookie.split(';').find(c => c.trim().startsWith('nr_token='))
    const token = tokenCookie?.split('=')[1]
    if (token) {
      api.restaurantMyModules(token)
        .then((json) => setMyModules(json.data || []))
        .catch(() => setMyModules([]))
    }
  }, [])

  function logout() {
    document.cookie = 'nr_token=; path=/; max-age=0'
    document.cookie = 'nr_user=; path=/; max-age=0'
    router.push('/login')
  }

  function itemVisible(item: NavItem): boolean {
    if (item.adminOnly) return user?.role === 'admin'
    if (!item.key) return true
    return user?.role === 'admin' || myModules === null || myModules.includes(item.key)
  }

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) || 'NR'

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg-page)' }}>
      <div className={`nr-overlay ${sidebarOpen ? 'nr-overlay-open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      <aside className={`nr-sidebar ${sidebarOpen ? 'nr-sidebar-open' : ''}`} style={{ width:220, background:'var(--bg-sidebar)', borderRight:'1px solid var(--border-color)', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, zIndex:50 }}>
        <div style={{ padding:'20px 16px', borderBottom:'1px solid var(--border-color)' }}>
          <div style={{ fontSize:20, fontWeight:800 }}>Nover<span style={{ color:'var(--accent)' }}>Resto</span></div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2, textTransform:'uppercase', letterSpacing:1 }}>v1.3.0</div>
        </div>

        <nav style={{ flex:1, padding:'8px 0', overflowY:'auto' }}>
          {navCategories.map(category => {
            const visibleItems = category.items.filter(itemVisible)
            if (visibleItems.length === 0) return null
            const isOpen = !mounted || openCategories.has(category.id)
            return (
              <div key={category.id} style={{ marginBottom: 2 }}>
                <button
                  onClick={() => toggleCategory(category.id)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 16px', background:'transparent', border:'none', cursor:'pointer',
                    fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1,
                    fontFamily:'Inter,sans-serif', fontWeight:700,
                  }}
                >
                  <span style={{ display:'flex', alignItems:'center', gap:6 }}>{category.icon} {category.label}</span>
                  <span style={{ fontSize:9, transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition:'transform .15s' }}>▼</span>
                </button>
                {isOpen && visibleItems.map(item => {
                  const active = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href} style={{
                      display:'flex', alignItems:'center', gap:10, padding:'9px 16px 9px 24px',
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
              </div>
            )
          })}
        </nav>

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

      <main className="nr-main" style={{ flex:1, marginLeft:220, minHeight:'100vh', overflow:'auto' }}>
        <div style={{ background:'var(--bg-sidebar)', borderBottom:'1px solid var(--border-color)', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:40 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button
              className="nr-hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
              style={{ alignItems:'center', justifyContent:'center', width:32, height:32, background:'transparent', border:'1px solid var(--border-color)', borderRadius:8, cursor:'pointer', fontSize:16, color:'var(--text-primary)' }}
            >
              ☰
            </button>
            <div className="nr-topbar-label" style={{ fontSize:13, color:'var(--text-muted)' }}>
              {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <ThemeToggleButton />
            <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent)' }}></div>
            <span style={{ fontSize:12, color:'var(--accent)', fontWeight:600 }}>{user?.restaurant || user?.name || '...'}</span>
          </div>
        </div>
        <div className="nr-page-padding" style={{ padding:24 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
