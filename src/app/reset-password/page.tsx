import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-fondo">
        <p className="text-gris text-sm">Cargando...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
