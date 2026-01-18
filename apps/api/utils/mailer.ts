/**
 * mailer.ts - Email Utility
 * 
 * Location: apps/api/ → Utils/ → mailer.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Email utility for sending emails via SMTP. Provides:
 * - Email sending functionality
 * - SMTP configuration
 * - Email template support
 * 
 * Related Files:
 * - Environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
 */

// @ts-nocheck
import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_FROM,
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT ? Number(SMTP_PORT) : 587,
  secure: SMTP_PORT ? Number(SMTP_PORT) === 465 : false,
  auth: SMTP_USER && SMTP_PASSWORD ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
});

export async function sendPasswordChangeEmail(options: {
  to: string;
  name?: string | null;
}) {
  if (!options.to || !SMTP_HOST) {
    console.warn('[mailer] Missing SMTP configuration or recipient; skipping password change email.');
    return;
  }

  const from = SMTP_FROM || SMTP_USER || 'no-reply@aqaraty.com';
  const displayName = options.name ? options.name.trim() : '';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; background-color:#f7f9fc; padding:24px;">
      <div style="max-width:480px; margin:auto; background:#fff; border-radius:16px; padding:28px; box-shadow:0 18px 60px rgba(15,118,110,0.12);">
        <h2 style="margin:0 0 12px; color:#047857;">تم تحديث كلمة المرور بنجاح</h2>
        <p style="margin:0 0 16px; color:#374151; line-height:1.6;">
          ${displayName ? `مرحباً ${displayName},` : 'مرحباً،'}<br/>تم تغيير كلمة المرور الخاصة بحسابك في منصة عقاراتي بنجاح.
        </p>
        <p style="margin:0 0 16px; color:#6b7280; line-height:1.6;">
          إذا لم تقم بإجراء هذا التغيير، يرجى التواصل مع فريق الدعم فوراً أو إعادة ضبط كلمة المرور من صفحة تسجيل الدخول.
        </p>
        <p style="margin:24px 0 0; color:#9ca3af; font-size:13px;">
          هذا البريد مرسل تلقائياً، يرجى عدم الرد عليه.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: options.to,
    subject: 'تأكيد تغيير كلمة المرور',
    html,
  });
}
