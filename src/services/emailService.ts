import { Resend } from 'resend';
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
  private resend: Resend;
  private templates: Map<string, Handlebars.TemplateDelegate>;
  private isDevelopment: boolean;
  private allowedTestEmail: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor() {
    console.log('Initializing EmailService...');
    
    // Validate required environment variables
    const requiredEnvVars = ['RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'FRONTEND_URL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new EmailError(`Missing required environment variables: ${missingVars.join(', ')}`, 'CONFIG_ERROR');
    }

    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.allowedTestEmail = process.env.ALLOWED_TEST_EMAIL || 'basitolaitan27@gmail.com';
    
    console.log('Environment:', this.isDevelopment ? 'Development' : 'Production');
    console.log('Environment variables validated');
    
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new EmailError('RESEND_API_KEY is not defined in environment variables', 'CONFIG_ERROR');
    }
    this.resend = new Resend(apiKey);
    this.templates = this.loadTemplates();
  }

  private validateEnvironment(): void {
    const requiredVars = ['RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'FRONTEND_URL'];
    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      throw new EmailError(
        `Missing required environment variables: ${missing.join(', ')}`,
        'CONFIG_ERROR'
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
      'welcome-email'
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
    retryCount: number = 0
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
    // In development, redirect all emails to the allowed test email
    const recipientEmail = this.isDevelopment ? this.allowedTestEmail : to;
    
    console.log('Attempting to send email:', {
      to,
      actualRecipient: recipientEmail,
      subject,
      fromEmail: process.env.RESEND_FROM_EMAIL,
      mode: this.isDevelopment ? 'Development' : 'Production'
    });

    try {
      this.validateEnvironment();

      const templateFn = this.templates.get(template);
      if (!templateFn) {
        throw new EmailError(`Template ${template} not found`, 'TEMPLATE_ERROR');
      }

      const html = templateFn(data);
      const fromEmail = process.env.RESEND_FROM_EMAIL!;

      await this.retryOperation(async () => {
        const result = await this.resend.emails.send({
          from: fromEmail,
          to: recipientEmail,
          subject: this.isDevelopment && to !== recipientEmail ? `[Original recipient: ${to}] ${subject}` : subject,
          html
        });
        console.log('Email sent successfully:', result);
      }, retryCount);
    } catch (error) {
      console.error('Error sending email:', error);
      console.error('Email options:', {
        from: process.env.RESEND_FROM_EMAIL,
        to: recipientEmail,
        subject
      });
      throw new EmailError(
        `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      );
    }
  }

  public async sendWelcomeEmail(
    to: string,
    username: string
  ): Promise<void> {
    console.log('Preparing welcome email for:', username);
    
    const template = this.templates.get('welcome-email');
    if (!template) {
      console.error('Welcome email template not found!');
      throw new EmailError('Template welcome-email not found', 'TEMPLATE_ERROR');
    }

    const templateData = {
      username,
      email: to,
      shopUrl: process.env.FRONTEND_URL,
      year: new Date().getFullYear(),
      address: process.env.COMPANY_ADDRESS || 'Your Eco-Friendly Phone Shop'
    };
    
    console.log('Template data:', templateData);

    const html = template(templateData);
    
    console.log('Generated HTML length:', html.length);

    await this.sendEmail({
      to,
      subject: 'Welcome to Green Phone Shop! 🌱📱',
      template: 'welcome-email',
      data: {}
    });
  }

  public async sendPasswordResetEmail(
    to: string,
    resetToken: string
  ): Promise<void> {
    const template = this.templates.get('password-reset');
    if (!template) {
      throw new EmailError('Template password-reset not found', 'TEMPLATE_ERROR');
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
        validityPeriod: '1 hour'
      }
    });
  }

  public async sendOrderConfirmationEmail(
    to: string,
    orderData: Record<string, any>
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Order Confirmation',
      template: 'order-confirmation',
      data: {
        ...orderData,
        siteName: 'Green Phone Shop'
      }
    });
  }

  public async sendOrderStatusUpdateEmail(
    to: string,
    statusData: Record<string, any>
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Order Status Update: ${statusData.status}`,
      template: 'order-status-update',
      data: {
        ...statusData,
        siteName: 'Green Phone Shop'
      }
    });
  }

  public async sendAdminOrderNotificationEmail(
    orderData: Record<string, any>
  ): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      throw new EmailError('ADMIN_EMAIL is not defined in environment variables', 'CONFIG_ERROR');
    }

    await this.sendEmail({
      to: adminEmail,
      subject: `New Order Received: #${orderData.orderNumber}`,
      template: 'admin-order-notification',
      data: {
        ...orderData,
        siteName: 'Green Phone Shop'
      }
    });
  }
}
