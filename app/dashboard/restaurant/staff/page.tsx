'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useCurrentRestaurant } from '../useCurrentRestaurant';
import { formatAmount } from '@/lib/currency';
import { RestaurantSelector } from '../RestaurantSelector';

interface Employee {
  id: number;
  name: string;
  role: string;
  phone: string | null;
  hourly_cost: string;
  is_active: boolean;
}

interface Shift {
  id: number;
  employee_id: number;
  employee_name: string;
  starts_at: string;
  ends_at: string;
  status: string;
}

const ROLE_LABELS: Record<string, string> = {
  manager: 'Manager', chef_cuisine: 'Chef de cuisine', cuisinier: 'Cuisinier',
  equipier: 'Équipier', caissier: 'Caissier', serveur: 'Serveur'
};

export default function StaffPage() {
  const { restaurant, restaurants, selectRestaurant, token } = useCurrentRestaurant();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', role: 'equipier', hourly_cost: '0' });
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [newShift, setNewShift] = useState({ employee_id: '', starts_at: '', ends_at: '' });

  const load = useCallback(() => {
    if (!restaurant || !token) return;
    setLoading(true);
    Promise.all([
      api.restaurantEmployees(token, restaurant.id),
      api.restaurantShifts(token, restaurant.id)
    ])
      .then(([empJson, shiftsJson]) => {
        setEmployees(empJson.data || []);
        setShifts(shiftsJson.data || []);
      })
      .finally(() => setLoading(false));
  }, [restaurant, token]);

  useEffect(() => { load(); }, [load]);

  const createEmployee = async () => {
    if (!restaurant || !token || !newEmployee.name) return;
    await api.restaurantEmployeeCreate(token, restaurant.id, {
      name: newEmployee.name, role: newEmployee.role, hourly_cost: Number(newEmployee.hourly_cost)
    });
    setNewEmployee({ name: '', role: 'equipier', hourly_cost: '0' });
    setShowEmployeeForm(false);
    load();
  };

  const createShift = async () => {
    if (!restaurant || !token || !newShift.employee_id || !newShift.starts_at || !newShift.ends_at) return;
    await api.restaurantShiftCreate(token, restaurant.id, {
      employee_id: Number(newShift.employee_id),
      starts_at: new Date(newShift.starts_at).toISOString(),
      ends_at: new Date(newShift.ends_at).toISOString()
    });
    setNewShift({ employee_id: '', starts_at: '', ends_at: '' });
    setShowShiftForm(false);
    load();
  };

  const deleteShift = async (id: number) => {
    if (!restaurant || !token) return;
    await api.restaurantShiftDelete(token, id, restaurant.id);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', color: 'var(--text-primary)' }}>
          👥 Équipe <span style={{ color: 'var(--accent)' }}>et planning</span>
        </h1>
        <RestaurantSelector restaurants={restaurants} selectedId={restaurant?.id ?? null} onChange={selectRestaurant} />
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>}

      {/* Employés */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>Employés</h2>
          <button
            onClick={() => setShowEmployeeForm(!showEmployeeForm)}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            + Nouvel employé
          </button>
        </div>

        {showEmployeeForm && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input placeholder="Nom" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13, flex: 1, minWidth: 160 }} />
            <select value={newEmployee.role} onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
              style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13 }}>
              {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input type="number" step="0.001" placeholder="Coût horaire" value={newEmployee.hourly_cost}
              onChange={(e) => setNewEmployee({ ...newEmployee, hourly_cost: e.target.value })}
              style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13, width: 120 }} />
            <button onClick={createEmployee} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--navy)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Créer
            </button>
          </div>
        )}

        <div className="nr-table-wrap" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-alt)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Nom</th>
                <th style={{ padding: 12 }}>Rôle</th>
                <th style={{ padding: 12 }}>Coût horaire</th>
                <th style={{ padding: 12 }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{e.name}</td>
                  <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{ROLE_LABELS[e.role] || e.role}</td>
                  <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{formatAmount(Number(e.hourly_cost), restaurant?.currency)}/h</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: e.is_active ? 'rgba(0,196,140,.15)' : 'rgba(106,143,171,.15)', color: e.is_active ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {e.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && employees.length === 0 && (
            <p style={{ color: 'var(--text-muted)', padding: 16 }}>Aucun employé. Créez-en un avec le bouton ci-dessus.</p>
          )}
        </div>
      </div>

      {/* Planning */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>Planning (créneaux à venir)</h2>
          <button
            onClick={() => setShowShiftForm(!showShiftForm)}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            + Nouveau créneau
          </button>
        </div>

        {showShiftForm && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select value={newShift.employee_id} onChange={(e) => setNewShift({ ...newShift, employee_id: e.target.value })}
              style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13 }}>
              <option value="">Employé...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <input type="datetime-local" value={newShift.starts_at} onChange={(e) => setNewShift({ ...newShift, starts_at: e.target.value })}
              style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13 }} />
            <input type="datetime-local" value={newShift.ends_at} onChange={(e) => setNewShift({ ...newShift, ends_at: e.target.value })}
              style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13 }} />
            <button onClick={createShift} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--navy)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Planifier
            </button>
          </div>
        )}

        <div className="nr-table-wrap" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-alt)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Employé</th>
                <th style={{ padding: 12 }}>Début</th>
                <th style={{ padding: 12 }}>Fin</th>
                <th style={{ padding: 12 }}>Statut</th>
                <th style={{ padding: 12 }}></th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{s.employee_name}</td>
                  <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{new Date(s.starts_at).toLocaleString('fr-FR')}</td>
                  <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{new Date(s.ends_at).toLocaleString('fr-FR')}</td>
                  <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{s.status}</td>
                  <td style={{ padding: 12 }}>
                    <button onClick={() => deleteShift(s.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}>Retirer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && shifts.length === 0 && (
            <p style={{ color: 'var(--text-muted)', padding: 16 }}>Aucun créneau planifié.</p>
          )}
        </div>
      </div>
    </div>
  );
}
