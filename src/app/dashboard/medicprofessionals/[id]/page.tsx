import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import { getMedicProfessionalsDb } from '@/lib/db';
import type { Professional } from '@/types';
import ProfessionalEditForm from './ProfessionalEditForm';

export default async function ProfessionalDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  let professional: Professional | null = null;

  try {
    const db = await getMedicProfessionalsDb();
    professional = db.get(
      `SELECT u.id, u.firstName, u.lastName, u.phone, u.email, u.username, u.role, u.created_at,
              pp.especialidad, pp.matricula, pp.institucion
       FROM users u
       LEFT JOIN professional_profiles pp ON pp.user_id = u.id
       WHERE u.id = ?`,
      [id]
    ) as unknown as Professional | null ?? null;
  } catch {
    return (
      <div className="bg-error-bg border border-error/20 rounded-xl p-5 text-sm text-error">
        No se pudo conectar a la base de datos de MedicProfessionals.
      </div>
    );
  }

  if (!professional) notFound();

  return (
    <div>
      <Header
        title={`${professional.firstName} ${professional.lastName}`}
        subtitle="Editar datos del usuario — MedicProfessionals"
      />
      <div className="max-w-xl">
        <ProfessionalEditForm professional={professional} />
      </div>
    </div>
  );
}
