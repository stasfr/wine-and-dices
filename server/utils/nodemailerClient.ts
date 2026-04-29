import nodemailer from 'nodemailer';

export function useNodemailerClient() {
  const config = useRuntimeConfig();

  if (!config.smtpUser || !config.smtpPassword) {
    throw new Error('One or more SMTP environment variables are missing');
  }

  const transporter = nodemailer.createTransport({
    auth: {
      pass: config.smtpPassword,
      user: config.smtpUser,
    },
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
  });

  return transporter;
}
