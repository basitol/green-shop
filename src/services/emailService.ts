import nodemailer from 'nodemailer';
import {readFileSync} from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, Handlebars.TemplateDelegate>;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    this.templates = new Map();
    this.loadTemplates();
  }

  private loadTemplates() {
    const templateNames = [
      'order-confirmation',
      'order-status-update',
      'admin-order-notification',
    ];

    templateNames.forEach(templateName => {
      const templatePath = path.join(
        __dirname,
        `../templates/${templateName}.hbs`,
      );
      const templateContent = readFileSync(templatePath, 'utf-8');
      this.templates.set(templateName, Handlebars.compile(templateContent));
    });
  }

  public async sendEmail({
    to,
    subject,
    template,
    data,
  }: EmailOptions): Promise<void> {
    try {
      const templateFn = this.templates.get(template);

      if (!templateFn) {
        throw new Error(`Template ${template} not found`);
      }

      const html = templateFn(data);

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}

const emailService = new EmailService();

export const sendEmail = (options: EmailOptions) =>
  emailService.sendEmail(options);
