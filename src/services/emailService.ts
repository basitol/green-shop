import nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import dotenv from 'dotenv';

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
  private senderEmail: string;
  private senderName: string;

  constructor() {
    console.log('Initializing Brevo SMTP Email Service...');

    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.allowedTestEmail = process.env.ALLOWED_TEST_EMAIL || 'basitolaitan27@gmail.com';
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'info@greenphone-shop.com';
    this.senderName = process.env.BREVO_SENDER_NAME || 'Green Phone Shop';

    // Initialize SMTP transporter with Brevo settings
    this.transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
      secure: process.env.BREVO_SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.BREVO_SMTP_USER || '',
        pass: process.env.BREVO_SMTP_PASS || ''
      }
    });

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        console.error('SMTP connection error:', error);
      } else {
        console.log('Brevo SMTP server is ready to send emails');
      }
    });

    this.templates = this.loadTemplates();
    console.log('Environment:', this.isDevelopment ? 'Development' : 'Production');
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
      ? this.allowedTestEmail
      : to;

    try {
      console.log(`Preparing to send email to: ${recipientEmail}`);
      console.log(`Using SMTP settings: ${process.env.BREVO_SMTP_HOST}:${process.env.BREVO_SMTP_PORT}`);
      
      const templateFn = this.templates.get(template);
      if (!templateFn) {
        throw new EmailError(
          `Template ${template} not found`,
          'TEMPLATE_ERROR',
        );
      }

      const html = templateFn(data);

      await this.retryOperation(async () => {
        console.log(`Sending email with subject: "${subject}"`);
        
        const mailOptions = {
          from: `"${this.senderName}" <${this.senderEmail}>`,
          to: recipientEmail,
          subject: this.isDevelopment && to !== recipientEmail
            ? `[TEST] ${subject}`
            : subject,
          html
        };
        
        console.log('Mail options:', JSON.stringify({
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject
        }));
        
        const result = await this.transporter.sendMail(mailOptions);
        console.log('Email sent successfully via Brevo SMTP:', result);
      }, retryCount);
    } catch (error) {
      console.error('Error sending email via Brevo SMTP:', error);
      throw new EmailError(
        `Failed to send email: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        'EMAIL_ERROR',
      );
    }
  }

  public async sendWelcomeEmail(
    email: string,
    fullName: string,
  ): Promise<void> {
    console.log('Preparing welcome email for:', fullName);

    const templateData = {
      fullName,
      email,
      shopUrl: process.env.FRONTEND_URL,
      year: new Date().getFullYear(),
      address: process.env.COMPANY_ADDRESS || 'Your Eco-Friendly Phone Shop',
    };

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
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password`;

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
