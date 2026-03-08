import 'dotenv/config';

const envs = [
  'NODE_ENV',
  'CLIENT_PORT',
  'CLIENT_URL',
  'CLIENT_PROTOCOL',
  'SERVER_PORT',
  'SERVER_URL',
  'SERVER_PROTOCOL',
  'DB_USER',
  'DB_PASSWORD',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'COOKIE_SECRET',
  'SMTP_USER',
  'SMTP_PASSWORD',
] as const;

export interface AppConfig {
  NODE_ENV: string;
  CLIENT_PORT: string;
  CLIENT_URL: string;
  CLIENT_PROTOCOL: string;
  SERVER_PORT: string;
  SERVER_URL: string;
  SERVER_PROTOCOL: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_HOST: string;
  DB_PORT: string;
  DB_NAME: string;
  COOKIE_SECRET: string;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  FULL_CLIENT_URL: string;
  FULL_SERVER_URL: string;
}

function loadConfig() {
  envs.forEach((env) => {
    const value = process.env[env];

    if (!value) {
      throw new Error(`${env} is not defined`);
    }
  });

  const {
    NODE_ENV,
    CLIENT_PORT,
    CLIENT_URL,
    CLIENT_PROTOCOL,
    SERVER_PORT,
    SERVER_URL,
    SERVER_PROTOCOL,
    DB_USER,
    DB_PASSWORD,
    DB_HOST,
    DB_PORT,
    DB_NAME,
    COOKIE_SECRET,
    SMTP_USER,
    SMTP_PASSWORD,
  } = process.env;

  return {
    NODE_ENV: NODE_ENV!,
    CLIENT_PORT: CLIENT_PORT!,
    CLIENT_URL: CLIENT_URL!,
    CLIENT_PROTOCOL: CLIENT_PROTOCOL!,
    SERVER_PORT: SERVER_PORT!,
    SERVER_URL: SERVER_URL!,
    SERVER_PROTOCOL: SERVER_PROTOCOL!,
    DB_USER: DB_USER!,
    DB_PASSWORD: DB_PASSWORD!,
    DB_HOST: DB_HOST!,
    DB_PORT: DB_PORT!,
    DB_NAME: DB_NAME!,
    COOKIE_SECRET: COOKIE_SECRET!,
    SMTP_USER: SMTP_USER!,
    SMTP_PASSWORD: SMTP_PASSWORD!,
    FULL_CLIENT_URL: `${CLIENT_PROTOCOL!}://${CLIENT_URL!}:${CLIENT_PORT!}`,
    FULL_SERVER_URL: `${SERVER_PROTOCOL!}://${SERVER_URL!}:${SERVER_PORT!}`,
  } as const satisfies AppConfig;
}

export const config = loadConfig();
