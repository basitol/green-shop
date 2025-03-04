// import nodemailer from 'nodemailer';
// import * as fs from 'fs';
// import * as path from 'path';
// import Handlebars from 'handlebars';
// import dotenv from 'dotenv';

// // Load environment variables
// dotenv.config();

// interface EmailOptions {
//   to: string;
//   subject: string;
//   template: string;
//   data: Record<string, any>;
//   retryCount?: number;
// }

// class EmailError extends Error {
//   constructor(message: string, public readonly code: string) {
//     super(message);
//     this.name = 'EmailError';
//   }
// }

// export class EmailService {
//   private transporter: nodemailer.Transporter;
//   private templates: Map<string, Handlebars.TemplateDelegate>;
//   private isDevelopment: boolean;
//   private readonly maxRetries = 3;
//   private readonly retryDelay = 1000; // 1 second

//   constructor() {
//     console.log('Initializing EmailService with Brevo...');

//     this.isDevelopment = process.env.NODE_ENV !== 'production';
//     this.validateEnvironment();

//     // Initialize Brevo SMTP transporter
//     if (!process.env.BREVO_API_KEY) {
//       console.warn(
//         'BREVO_API_KEY not set. Email service will not work properly.',
//       );
//       // Set up a mock transporter that logs but doesn't send
//       this.transporter = nodemailer.createTransport({
//         jsonTransport: true,
//       });
//       console.log('Using mock transporter that will only log emails.');
//     } else {
//       // Initialize SMTP transporter with Brevo
//       this.transporter = nodemailer.createTransport({
//         host: 'smtp-relay.brevo.com',
//         port: 587,
//         secure: false, // true for 465, false for other ports
//         auth: {
//           user: process.env.BREVO_SMTP_USER,
//           pass: process.env.BREVO_API_KEY,
//         },
//       });

//       // Verify SMTP connection
//       this.transporter.verify(error => {
//         if (error) {
//           console.error('Brevo SMTP connection error:', error);
//         } else {
//           console.log('Brevo SMTP server is ready to send emails');
//         }
//       });
//     }

//     console.log(
//       'Environment:',
//       this.isDevelopment ? 'Development' : 'Production',
//     );
//     console.log('Environment variables validated');

//     this.templates = this.loadTemplates();
//   }

//   private validateEnvironment(): void {
//     const requiredVars = ['BREVO_API_KEY', 'BREVO_SMTP_USER', 'FRONTEND_URL'];
//     const missing = requiredVars.filter(varName => !process.env[varName]);

//     if (missing.length > 0) {
//       throw new EmailError(
//         `Missing required environment variables: ${missing.join(', ')}`,
//         'CONFIG_ERROR',
//       );
//     }
//   }

//   private loadTemplates(): Map<string, Handlebars.TemplateDelegate> {
//     console.log('Loading email templates...');
//     const templates = new Map<string, Handlebars.TemplateDelegate>();
//     const templateNames = [
//       'order-confirmation',
//       'order-status-update',
//       'admin-order-notification',
//       'password-reset',
//       'welcome-email',
//     ];

//     templateNames.forEach(name => {
//       const templatePath = path.join(__dirname, `../templates/${name}.hbs`);
//       console.log(`Looking for template: ${templatePath}`);

//       if (fs.existsSync(templatePath)) {
//         try {
//           const templateContent = fs.readFileSync(templatePath, 'utf-8');
//           templates.set(name, Handlebars.compile(templateContent));
//           console.log(`Successfully loaded template: ${name}`);
//         } catch (error) {
//           console.error(`Error loading template ${name}:`, error);
//         }
//       } else {
//         console.error(`Template not found: ${templatePath}`);
//       }
//     });

//     console.log(`Loaded ${templates.size}/${templateNames.length} templates`);
//     return templates;
//   }

//   private async retryOperation<T>(
//     operation: () => Promise<T>,
//     retryCount: number = 0,
//   ): Promise<T> {
//     try {
//       return await operation();
//     } catch (error) {
//       if (retryCount >= this.maxRetries) {
//         throw error;
//       }

//       await new Promise(resolve => setTimeout(resolve, this.retryDelay));
//       return this.retryOperation(operation, retryCount + 1);
//     }
//   }

//   private async sendEmail({
//     to,
//     subject,
//     template,
//     data,
//     retryCount = 0,
//   }: EmailOptions): Promise<void> {
//     // Always send to the actual recipient, regardless of environment
//     // This ensures you receive all emails during local development
//     const recipientEmail = to;

//     try {
//       const templateFn = this.templates.get(template);
//       if (!templateFn) {
//         throw new EmailError(
//           `Template ${template} not found`,
//           'TEMPLATE_ERROR',
//         );
//       }

//       const html = templateFn(data);

//       await this.retryOperation(async () => {
//         const result = await this.transporter.sendMail({
//           from: `"${process.env.FROM_NAME || 'Green Phone Shop'}" <${
//             process.env.BREVO_SMTP_USER
//           }>`,
//           to: recipientEmail,
//           subject:
//             this.isDevelopment && to !== recipientEmail
//               ? `[TEST] ${subject}`
//               : subject,
//           html,
//         });
//         console.log('Email sent successfully via Brevo:', result.messageId);
//       }, retryCount);
//     } catch (error) {
//       console.error('Error sending email with Brevo:', error);
//       throw new EmailError(
//         `Failed to send email: ${
//           error instanceof Error ? error.message : 'Unknown error'
//         }`,
//         'SMTP_ERROR',
//       );
//     }
//   }

//   public async sendWelcomeEmail(
//     email: string,
//     fullName: string,
//   ): Promise<void> {
//     console.log('Preparing welcome email for:', fullName);

//     const template = this.templates.get('welcome-email');
//     if (!template) {
//       console.error('Welcome email template not found!');
//       throw new EmailError(
//         'Template welcome-email not found',
//         'TEMPLATE_ERROR',
//       );
//     }

//     const templateData = {
//       fullName,
//       email,
//       shopUrl: process.env.FRONTEND_URL,
//       year: new Date().getFullYear(),
//       address: process.env.COMPANY_ADDRESS || 'Your Eco-Friendly Phone Shop',
//     };

//     console.log('Template data:', templateData);

//     const html = template(templateData);

//     console.log('Generated HTML length:', html.length);

//     await this.sendEmail({
//       to: email,
//       subject: 'Welcome to Green Phone Shop! 🌱📱',
//       template: 'welcome-email',
//       data: templateData,
//     });
//   }

//   public async sendPasswordResetEmail(
//     to: string,
//     resetToken: string,
//   ): Promise<void> {
//     const template = this.templates.get('password-reset');
//     if (!template) {
//       throw new EmailError(
//         'Template password-reset not found',
//         'TEMPLATE_ERROR',
//       );
//     }

//     const resetUrl = `${process.env.FRONTEND_URL}/api/users/reset-password`;

//     await this.sendEmail({
//       to,
//       subject: 'Password Reset Request',
//       template: 'password-reset',
//       data: {
//         resetUrl,
//         resetToken,
//         siteName: 'Green Phone Shop',
//         validityPeriod: '1 hour',
//       },
//     });
//   }

//   public async sendOrderConfirmationEmail(
//     to: string,
//     orderData: Record<string, any>,
//   ): Promise<void> {
//     await this.sendEmail({
//       to,
//       subject: 'Order Confirmation',
//       template: 'order-confirmation',
//       data: {
//         ...orderData,
//         siteName: 'Green Phone Shop',
//       },
//     });
//   }

//   public async sendOrderStatusUpdateEmail(
//     to: string,
//     statusData: Record<string, any>,
//   ): Promise<void> {
//     await this.sendEmail({
//       to,
//       subject: `Order Status Update: ${statusData.status}`,
//       template: 'order-status-update',
//       data: {
//         ...statusData,
//         siteName: 'Green Phone Shop',
//       },
//     });
//   }

//   public async sendAdminOrderNotificationEmail(
//     orderData: Record<string, any>,
//   ): Promise<void> {
//     const adminEmail = process.env.ADMIN_EMAIL;
//     if (!adminEmail) {
//       throw new EmailError(
//         'ADMIN_EMAIL is not defined in environment variables',
//         'CONFIG_ERROR',
//       );
//     }

//     await this.sendEmail({
//       to: adminEmail,
//       subject: `New Order Received: #${orderData.orderNumber}`,
//       template: 'admin-order-notification',
//       data: {
//         ...orderData,
//         siteName: 'Green Phone Shop',
//       },
//     });
//   }
// }

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
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor() {
    console.log('Initializing EmailService with Brevo...');

    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.validateEnvironment();

    // Initialize Brevo SMTP transporter
    if (!process.env.BREVO_API_KEY) {
      console.warn(
        'BREVO_API_KEY not set. Email service will not work properly.',
      );
      // Set up a mock transporter that logs but doesn't send
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      console.log('Using mock transporter that will only log emails.');
    } else {
      // Initialize SMTP transporter with Brevo
      this.transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.BREVO_SMTP_USER,
          pass: process.env.BREVO_API_KEY,
        },
      });

      // Verify SMTP connection
      this.transporter.verify(error => {
        if (error) {
          console.error('Brevo SMTP connection error:', error);
        } else {
          console.log('Brevo SMTP server is ready to send emails');
        }
      });
    }

    console.log(
      'Environment:',
      this.isDevelopment ? 'Development' : 'Production',
    );
    console.log('Environment variables validated');

    this.templates = this.loadTemplates();
  }

  private validateEnvironment(): void {
    const requiredVars = ['FRONTEND_URL'];

    // In production, enforce Brevo credentials
    if (!this.isDevelopment) {
      requiredVars.push('BREVO_API_KEY');
      requiredVars.push('BREVO_SMTP_USER');
    }

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
    // Always send to the actual recipient, regardless of environment
    // This ensures you receive all emails during local development
    const recipientEmail = to;

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
          from: `"${process.env.FROM_NAME || 'Green Phone Shop'}" <${
            process.env.BREVO_SMTP_USER
          }>`,
          to: recipientEmail,
          subject:
            this.isDevelopment && to !== recipientEmail
              ? `[TEST] ${subject}`
              : subject,
          html,
        });
        console.log('Email sent successfully via Brevo:', result.messageId);
      }, retryCount);
    } catch (error) {
      console.error('Error sending email with Brevo:', error);
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
