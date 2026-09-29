import nodemailer from 'nodemailer';
import type { AppConfig } from '../config/env.js';

export interface Mailer {
  sendVerificationCode(to: string, code: string, validForMinutes: number): Promise<void>;
}

export function createSmtpMailer(smtp: AppConfig['smtp']): Mailer {
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
  });

  return {
    async sendVerificationCode(to, code, validForMinutes) {
      await transport.sendMail({
        from: smtp.from,
        to,
        subject: `${code} is your PadosiPro verification code`,
        text: [
          'Welcome to PadosiPro.',
          '',
          `Your verification code is ${code}.`,
          `It is valid for ${validForMinutes} minutes and can be used once.`,
          '',
          "If you didn't create a PadosiPro account, you can ignore this email.",
        ].join('\n'),
        html: `
          <div style="font-family:Arial,sans-serif;background:#FAFAF7;padding:32px">
            <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #D0D5DD;border-radius:16px;padding:32px">
              <h1 style="color:#155C49;font-size:22px;margin:0 0 8px">PadosiPro</h1>
              <p style="color:#667085;margin:0 0 24px">A calmer way to get things handled.</p>
              <p style="color:#101828;margin:0 0 12px">Your verification code is</p>
              <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#101828;margin:0 0 24px">${code}</p>
              <p style="color:#667085;font-size:14px;margin:0">
                Valid for ${validForMinutes} minutes and can be used once.
                If you didn't create a PadosiPro account, you can ignore this email.
              </p>
            </div>
          </div>`,
      });
    },
  };
}
