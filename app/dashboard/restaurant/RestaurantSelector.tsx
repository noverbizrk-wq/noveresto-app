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
    <select
      className="border rounded-lg px-3 py-2 text-sm bg-white"
      value={selectedId ?? ''}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ borderColor: '#00C48C', color: '#0D2137' }}
    >
      {restaurants.map((r) => (
        <option key={r.id} value={r.id}>{r.name}</option>
      ))}
    </select>
  );
}
