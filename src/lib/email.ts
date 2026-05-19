import 'server-only';
import nodemailer from 'nodemailer';

export async function sendPasswordResetEmail(resetUrl: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"MedicAdmin" <${process.env.GMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: 'Restablecer contraseña - MedicAdmin',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e3a5f; margin-bottom: 16px;">Restablecer contraseña</h2>
        <p style="color: #374151;">Recibiste este email porque solicitaste restablecer la contraseña de MedicAdmin.</p>
        <p style="margin: 28px 0;">
          <a href="${resetUrl}"
             style="background-color: #2563eb; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Restablecer contraseña
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">Este link expira en 1 hora.</p>
        <p style="color: #6b7280; font-size: 14px;">Si no solicitaste esto, podés ignorar este email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 24px;" />
        <p style="color: #9ca3af; font-size: 12px;">MedicAdmin · Panel de administración</p>
      </div>
    `,
  });
}
