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

  constructor() {
    console.log('Initializing EmailService with Gmail...');
    
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Check for required environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('Missing Gmail credentials in environment variables');
      throw new Error('Email configuration is incomplete');
    }

    // Initialize Gmail SMTP transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Verify connection
    this.transporter.verify(error => {
      if (error) {
        console.error('Gmail connection error:', error);
        console.log('Gmail credentials:', {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD?.substring(0, 4) + '****' // Log partially hidden password
        });
      } else {
        console.log('Gmail server is ready to send emails');
      }
    });

    this.templates = this.loadTemplates();
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

  private async sendEmail({
    to,
    subject,
    template,
    data,
  }: EmailOptions): Promise<void> {
    try {
      const templateFn = this.templates.get(template);
      if (!templateFn) {
        throw new EmailError(
          `Template ${template} not found`,
          'TEMPLATE_ERROR',
        );
      }

      const html = templateFn(data);

      const mailOptions = {
        from: {
          name: process.env.MAIL_FROM_NAME || 'Green Phone Shop',
          address: process.env.GMAIL_USER!, // Use your Gmail address
        },
        to: to,
        subject: subject,
        html: html,
      };

      console.log('Attempting to send email to:', to);
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
    } catch (error) {
      console.error('Failed to send email:', error);
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
      shopUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
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
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await this.sendEmail({
      to,
      subject: 'Password Reset Request - Green Phone Shop',
      template: 'password-reset',
      data: {
        resetUrl,
        resetToken,
        userName: to.split('@')[0],
        validityPeriod: '30 minutes',
        siteName: 'Green Phone Shop',
        year: new Date().getFullYear(),
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
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

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
