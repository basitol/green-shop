"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const resend_1 = require("resend");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
class EmailError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'EmailError';
    }
}
class EmailService {
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
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
        this.resend = new resend_1.Resend(apiKey);
        this.templates = this.loadTemplates();
    }
    validateEnvironment() {
        const requiredVars = ['RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'FRONTEND_URL'];
        const missing = requiredVars.filter(varName => !process.env[varName]);
        if (missing.length > 0) {
            throw new EmailError(`Missing required environment variables: ${missing.join(', ')}`, 'CONFIG_ERROR');
        }
    }
    loadTemplates() {
        console.log('Loading email templates...');
        const templates = new Map();
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
                    templates.set(name, handlebars_1.default.compile(templateContent));
                    console.log(`Successfully loaded template: ${name}`);
                }
                catch (error) {
                    console.error(`Error loading template ${name}:`, error);
                }
            }
            else {
                console.error(`Template not found: ${templatePath}`);
            }
        });
        console.log(`Loaded ${templates.size}/${templateNames.length} templates`);
        return templates;
    }
    retryOperation(operation_1) {
        return __awaiter(this, arguments, void 0, function* (operation, retryCount = 0) {
            try {
                return yield operation();
            }
            catch (error) {
                if (retryCount >= this.maxRetries) {
                    throw error;
                }
                yield new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.retryOperation(operation, retryCount + 1);
            }
        });
    }
    sendEmail(_a) {
        return __awaiter(this, arguments, void 0, function* ({ to, subject, template, data, retryCount = 0, }) {
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
                const fromEmail = process.env.RESEND_FROM_EMAIL;
                yield this.retryOperation(() => __awaiter(this, void 0, void 0, function* () {
                    const result = yield this.resend.emails.send({
                        from: fromEmail,
                        to: recipientEmail,
                        subject: this.isDevelopment && to !== recipientEmail ? `[Original recipient: ${to}] ${subject}` : subject,
                        html
                    });
                    console.log('Email sent successfully:', result);
                }), retryCount);
            }
            catch (error) {
                console.error('Error sending email:', error);
                console.error('Email options:', {
                    from: process.env.RESEND_FROM_EMAIL,
                    to: recipientEmail,
                    subject
                });
                throw new EmailError(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.message : 'UNKNOWN_ERROR');
            }
        });
    }
    sendWelcomeEmail(to, username) {
        return __awaiter(this, void 0, void 0, function* () {
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
            yield this.sendEmail({
                to,
                subject: 'Welcome to Green Phone Shop! 🌱📱',
                template: 'welcome-email',
                data: {}
            });
        });
    }
    sendPasswordResetEmail(to, resetToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = this.templates.get('password-reset');
            if (!template) {
                throw new EmailError('Template password-reset not found', 'TEMPLATE_ERROR');
            }
            const resetUrl = `${process.env.FRONTEND_URL}/api/users/reset-password`;
            yield this.sendEmail({
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
        });
    }
    sendOrderConfirmationEmail(to, orderData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendEmail({
                to,
                subject: 'Order Confirmation',
                template: 'order-confirmation',
                data: Object.assign(Object.assign({}, orderData), { siteName: 'Green Phone Shop' })
            });
        });
    }
    sendOrderStatusUpdateEmail(to, statusData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendEmail({
                to,
                subject: `Order Status Update: ${statusData.status}`,
                template: 'order-status-update',
                data: Object.assign(Object.assign({}, statusData), { siteName: 'Green Phone Shop' })
            });
        });
    }
    sendAdminOrderNotificationEmail(orderData) {
        return __awaiter(this, void 0, void 0, function* () {
            const adminEmail = process.env.ADMIN_EMAIL;
            if (!adminEmail) {
                throw new EmailError('ADMIN_EMAIL is not defined in environment variables', 'CONFIG_ERROR');
            }
            yield this.sendEmail({
                to: adminEmail,
                subject: `New Order Received: #${orderData.orderNumber}`,
                template: 'admin-order-notification',
                data: Object.assign(Object.assign({}, orderData), { siteName: 'Green Phone Shop' })
            });
        });
    }
}
exports.EmailService = EmailService;
