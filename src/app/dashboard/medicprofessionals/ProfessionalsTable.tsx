'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Professional } from '@/types';

const PAGE_SIZE = 20;

export default function ProfessionalsTable({ professionals }: { professionals: Professional[] }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState('todos');
  const [specialtyFilter, setSpecialtyFilter] = useState('todos');
  const [page, setPage] = useState(1);

  const specialties = useMemo(() => {
    const set = new Set<string>();
    professionals.forEach((p) => {
      if (p.especialidad) set.add(p.especialidad);
    });
    return Array.from(set).sort();
  }, [professionals]);

  const filtered = useMemo(() => {
    let result = professionals;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q) ||
          (p.matricula && p.matricula.toLowerCase().includes(q))
      );
    }

    if (roleFilter !== 'todos') {
      result = result.filter((p) => p.role === roleFilter);
    }

    if (specialtyFilter !== 'todos') {
      result = result.filter((p) => p.especialidad === specialtyFilter);
    }

    if (dateFilter !== 'todos') {
      const days = parseInt(dateFilter);
      const since = new Date();
      since.setDate(since.getDate() - days);
      result = result.filter((p) => new Date(p.created_at) >= since);
    }

    return result;
  }, [professionals, search, roleFilter, specialtyFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  function changePage(newPage: number) {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }

  function resetPage() {
    setPage(1);
  }

  const verificationBadge = (status: string | null) => {
    if (status === 'pendiente') return <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-warning-bg text-warning">Pendiente</span>;
    if (status === 'aprobado') return <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-verde-bg text-verde">Aprobado</span>;
    if (status === 'rechazado') return <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-error-bg text-error">Rechazado</span>;
    return null;
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, email, usuario o matrícula..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-borde bg-white text-texto text-sm
                     focus:outline-none focus:ring-2 focus:ring-azul focus:border-transparent transition"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); resetPage(); }}
          className="px-3 py-2 rounded-lg border border-borde bg-white text-texto text-sm
                     focus:outline-none focus:ring-2 focus:ring-azul focus:border-transparent transition"
        >
          <option value="todos">Todos los roles</option>
          <option value="patient">Paciente</option>
          <option value="professional">Profesional</option>
        </select>
        <select
          value={specialtyFilter}
          onChange={(e) => { setSpecialtyFilter(e.target.value); resetPage(); }}
          className="px-3 py-2 rounded-lg border border-borde bg-white text-texto text-sm
                     focus:outline-none focus:ring-2 focus:ring-azul focus:border-transparent transition"
        >
          <option value="todos">Todas las especialidades</option>
          {specialties.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); resetPage(); }}
          className="px-3 py-2 rounded-lg border border-borde bg-white text-texto text-sm
                     focus:outline-none focus:ring-2 focus:ring-azul focus:border-transparent transition"
        >
          <option value="todos">Todas las fechas</option>
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-borde overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borde bg-fondo">
              <th className="px-4 py-3 text-left font-semibold text-gris">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold text-gris">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gris">Rol</th>
              <th className="px-4 py-3 text-left font-semibold text-gris">Especialidad</th>
              <th className="px-4 py-3 text-left font-semibold text-gris">Matrícula</th>
              <th className="px-4 py-3 text-left font-semibold text-gris">Estado</th>
              <th className="px-4 py-3 text-left font-semibold text-gris">Registro</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gris">
                  No hay usuarios que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              pageItems.map((p) => (
                <tr key={p.id} className={`hover:bg-fondo transition ${p.banned_at ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-medium text-texto">
                    {p.firstName} {p.lastName}
                    {p.banned_at && (
                      <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded bg-error-bg text-error">
                        Baneado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gris">{p.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                      ${p.role === 'professional' ? 'bg-verde-bg text-verde' : 'bg-azul-suave text-azul'}`}>
                      {p.role === 'professional' ? 'Profesional' : 'Paciente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gris">{p.especialidad ?? '—'}</td>
                  <td className="px-4 py-3 text-gris">{p.matricula ?? '—'}</td>
                  <td className="px-4 py-3">{verificationBadge(p.verification_status)}</td>
                  <td className="px-4 py-3 text-gris-claro text-xs">
                    {new Date(p.created_at).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/medicprofessionals/${p.id}`} className="text-azul hover:text-azul-hover text-xs font-semibold">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gris">
          <span>
            Mostrando {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} de {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => changePage(safePage - 1)}
              disabled={safePage <= 1}
              className="px-3 py-1.5 rounded-lg border border-borde bg-white text-texto text-sm
                         hover:bg-fondo transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => changePage(safePage + 1)}
              disabled={safePage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-borde bg-white text-texto text-sm
                         hover:bg-fondo transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
