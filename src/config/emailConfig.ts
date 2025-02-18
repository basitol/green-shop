import { TransportOptions } from 'nodemailer';

interface SMTPConfig extends TransportOptions {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string | undefined;
  };
}

interface EmailConfig {
  smtp: SMTPConfig;
  from: {
    name: string;
    email: string;
  };
}

export const emailConfig: EmailConfig = {
  smtp: {
    host: 'greenphone-shop.com',
    port: 465,
    secure: true, // true for port 465
    auth: {
      user: 'info@greenphone-shop.com',
      pass: process.env.EMAIL_PASSWORD
    }
  },
  from: {
    name: 'Green Phone Shop',
    email: 'info@greenphone-shop.com'
  }
}; 