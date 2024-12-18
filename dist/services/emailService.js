"use strict";
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
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        this.templates = new Map();
        this.loadTemplates();
    }
    loadTemplates() {
        const templateNames = [
            'order-confirmation',
            'order-status-update',
            'admin-order-notification',
        ];
        templateNames.forEach(templateName => {
            const templatePath = path_1.default.join(__dirname, `../templates/${templateName}.hbs`);
            const templateContent = (0, fs_1.readFileSync)(templatePath, 'utf-8');
            this.templates.set(templateName, handlebars_1.default.compile(templateContent));
        });
    }
    sendEmail(_a) {
        return __awaiter(this, arguments, void 0, function* ({ to, subject, template, data, }) {
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
                yield this.transporter.sendMail(mailOptions);
                console.log(`Email sent successfully to ${to}`);
            }
            catch (error) {
                console.error('Error sending email:', error);
                throw error;
            }
        });
    }
}
const emailService = new EmailService();
const sendEmail = (options) => emailService.sendEmail(options);
exports.sendEmail = sendEmail;
