'use client';

interface RestaurantOption {
  id: number;
  name: string;
}

export function RestaurantSelector({
  restaurants,
  selectedId,
  onChange
}: {
  restaurants: RestaurantOption[];
  selectedId: number | null;
  onChange: (id: number) => void;
}) {
  if (restaurants.length <= 1) return null;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <span style={{ position: 'absolute', left: 12, fontSize: 14, pointerEvents: 'none' }}>🏪</span>
      <select
        value={selectedId ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          padding: '9px 32px 9px 34px',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary)',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: 'Inter,sans-serif',
          maxWidth: 240,
          textOverflow: 'ellipsis',
        }}
        title={`${restaurants.length} établissements — cliquez pour changer`}
      >
        {restaurants.map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>
      <span style={{ position: 'absolute', right: 10, fontSize: 9, color: 'var(--text-muted)', pointerEvents: 'none' }}>▼</span>
    </div>
  );
}
