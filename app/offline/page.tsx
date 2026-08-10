export default function OfflinePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#081522', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: 24 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>
          Nover<span style={{ color: '#00C48C' }}>Resto</span>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Vous êtes hors ligne</h1>
        <p style={{ color: '#8BAABF', fontSize: 14, maxWidth: 380 }}>
          Cette page n'a pas encore été consultée et nécessite une connexion. Les pages déjà visitées restent accessibles hors ligne.
        </p>
      </div>
    </div>
  );
}
