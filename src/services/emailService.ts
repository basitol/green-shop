import nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import dotenv from 'dotenv';
import {emailConfig} from '../config/emailConfig';

// Load environment variables
dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  retryCount?: number;
}

class EmailError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'EmailError';
  }
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, Handlebars.TemplateDelegate>;
  private isDevelopment: boolean;
  private allowedTestEmail: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor() {
    console.log('Initializing EmailService...');

    this.isDevelopment = process.env.NODE_ENV !== 'production';

    // In development, allow a fallback for email password
    if (!process.env.EMAIL_PASSWORD) {
      if (this.isDevelopment) {
        console.warn(
          'EMAIL_PASSWORD not set, using development mode with console logging',
        );
        // Set up a mock transporter for development
        this.transporter = nodemailer.createTransport({
          jsonTransport: true, // This will just log the email data
        });
      } else {
        throw new EmailError('EMAIL_PASSWORD is not defined', 'CONFIG_ERROR');
      }
    } else {
      // Initialize SMTP transporter with proper typing
      this.transporter = nodemailer.createTransport({
        ...emailConfig.smtp,
        auth: {
          ...emailConfig.smtp.auth,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      // Verify SMTP connection
      this.transporter.verify(error => {
        if (error) {
          console.error('SMTP connection error:', error);
        } else {
          console.log('SMTP server is ready to send emails');
        }
      });
    }

    this.allowedTestEmail =
      process.env.ALLOWED_TEST_EMAIL || 'basitolaitan27@gmail.com';

    console.log(
      'Environment:',
      this.isDevelopment ? 'Development' : 'Production',
    );
    console.log('Environment variables validated');

    this.templates = this.loadTemplates();
  }

  private validateEnvironment(): void {
    const requiredVars = [
      'RESEND_API_KEY',
      'RESEND_FROM_EMAIL',
      'FRONTEND_URL',
    ];
    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      throw new EmailError(
        `Missing required environment variables: ${missing.join(', ')}`,
        'CONFIG_ERROR',
      );
    }
  }

  private loadTemplates(): Map<string, Handlebars.TemplateDelegate> {
    console.log('Loading email templates...');
    const templates = new Map<string, Handlebars.TemplateDelegate>();
    const templateNames = [
      'order-confirmation',
      'order-status-update',
      'admin-order-notification',
      'password-reset',
      'welcome-email',
    ];

    templateNames.forEach(name => {
      const templatePath = path.join(__dirname, `../templates/${name}.hbs`);
      console.log(`Looking for template: ${templatePath}`);

      if (fs.existsSync(templatePath)) {
        try {
          const templateContent = fs.readFileSync(templatePath, 'utf-8');
          templates.set(name, Handlebars.compile(templateContent));
          console.log(`Successfully loaded template: ${name}`);
        } catch (error) {
          console.error(`Error loading template ${name}:`, error);
        }
      } else {
        console.error(`Template not found: ${templatePath}`);
      }
    });

    console.log(`Loaded ${templates.size}/${templateNames.length} templates`);
    return templates;
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    retryCount: number = 0,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retryCount >= this.maxRetries) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      return this.retryOperation(operation, retryCount + 1);
    }
  }

  private async sendEmail({
    to,
    subject,
    template,
    data,
    retryCount = 0,
  }: EmailOptions): Promise<void> {
    const recipientEmail = this.isDevelopment
      ? process.env.ALLOWED_TEST_EMAIL || to
      : to;

    try {
      const templateFn = this.templates.get(template);
      if (!templateFn) {
        throw new EmailError(
          `Template ${template} not found`,
          'TEMPLATE_ERROR',
        );
      }

      const html = templateFn(data);

      await this.retryOperation(async () => {
        const result = await this.transporter.sendMail({
          from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
          to: recipientEmail,
          subject:
            this.isDevelopment && to !== recipientEmail
              ? `[TEST] ${subject}`
              : subject,
          html,
        });
        console.log('Email sent successfully:', result.messageId);
      }, retryCount);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new EmailError(
        `Failed to send email: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        'SMTP_ERROR',
      );
    }
  }

  public async sendWelcomeEmail(
    email: string,
    fullName: string,
  ): Promise<void> {
    console.log('Preparing welcome email for:', fullName);

    const template = this.templates.get('welcome-email');
    if (!template) {
      console.error('Welcome email template not found!');
      throw new EmailError(
        'Template welcome-email not found',
        'TEMPLATE_ERROR',
      );
    }

    const templateData = {
      fullName,
      email,
      shopUrl: process.env.FRONTEND_URL,
      year: new Date().getFullYear(),
      address: process.env.COMPANY_ADDRESS || 'Your Eco-Friendly Phone Shop',
    };

    console.log('Template data:', templateData);

    const html = template(templateData);

    console.log('Generated HTML length:', html.length);

    await this.sendEmail({
      to: email,
      subject: 'Welcome to Green Phone Shop! 🌱📱',
      template: 'welcome-email',
      data: templateData,
    });
  }

  public async sendPasswordResetEmail(
    to: string,
    resetToken: string,
  ): Promise<void> {
    const template = this.templates.get('password-reset');
    if (!template) {
      throw new EmailError(
        'Template password-reset not found',
        'TEMPLATE_ERROR',
      );
    }

    const resetUrl = `${process.env.FRONTEND_URL}/api/users/reset-password`;

    await this.sendEmail({
      to,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: {
        resetUrl,
        resetToken,
        siteName: 'Green Phone Shop',
        validityPeriod: '1 hour',
      },
    });
  }

  public async sendOrderConfirmationEmail(
    to: string,
    orderData: Record<string, any>,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Order Confirmation',
      template: 'order-confirmation',
      data: {
        ...orderData,
        siteName: 'Green Phone Shop',
      },
    });
  }

  public async sendOrderStatusUpdateEmail(
    to: string,
    statusData: Record<string, any>,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Order Status Update: ${statusData.status}`,
      template: 'order-status-update',
      data: {
        ...statusData,
        siteName: 'Green Phone Shop',
      },
    });
  }

  public async sendAdminOrderNotificationEmail(
    orderData: Record<string, any>,
  ): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      throw new EmailError(
        'ADMIN_EMAIL is not defined in environment variables',
        'CONFIG_ERROR',
      );
    }

    await this.sendEmail({
      to: adminEmail,
      subject: `New Order Received: #${orderData.orderNumber}`,
      template: 'admin-order-notification',
      data: {
        ...orderData,
        siteName: 'Green Phone Shop',
      },
    });
  }
}
