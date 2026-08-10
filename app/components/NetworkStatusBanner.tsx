'use client';

import { useEffect, useState } from 'react';

export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Rien à afficher côté serveur (évite un flash incohérent au premier rendu),
  // ni quand la connexion est présente.
  if (!mounted || isOnline) return null;

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 999, background: '#B7791F', color: '#081522',
      textAlign: 'center', fontSize: 13, fontWeight: 700, padding: '8px 16px',
    }}>
      ⚠️ Vous êtes hors ligne — vous consultez les dernières données connues. La création et la modification de commandes, stocks, etc. nécessitent une connexion.
    </div>
  );
}
