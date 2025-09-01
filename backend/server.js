require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient, Prisma } = require('@prisma/client');
const Joi = require('joi');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const pino = require('pino');
const pinoHttp = require('pino-http');
const ms = require('ms');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;

const app = express();
const prisma = new PrismaClient();
const certPath = path.join(__dirname, 'qz-certs', 'client.pem');
const keyPath = path.join(__dirname, 'qz-certs', 'client.key');

let certificate = '';
let privateKey = '';

// Configure Pino Logger
const logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss Z',
            ignore: 'pid,hostname',
        }
    } : undefined,
});

const httpLogger = pinoHttp({ logger });

// Environment Configuration
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "";
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
const ACCESS_TOKEN_EXPIRATION = process.env.ACCESS_TOKEN_EXPIRATION || '15m';
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || '7d';
const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || 'ZIG';
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || "";
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASS = process.env.EMAIL_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER || "";

// Default Admin Configuration
const DEFAULT_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || "";
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "";
const DEFAULT_ADMIN_BRANCH = process.env.DEFAULT_ADMIN_BRANCH || '00';


if (!JWT_SECRET || !REFRESH_SECRET) {
    logger.fatal('FATAL ERROR: JWT_SECRET and REFRESH_SECRET must be defined in .env');
    process.exit(1);
}

if (!process.env.NODE_ENV) {
    logger.warn('NODE_ENV is not set. Defaulting to development.');
    process.env.NODE_ENV = 'development';
}



// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: EMAIL_SERVICE,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

// --- Reminder Logic and Cron Job ---
async function sendEmailReminder(to, subject, html) {
    try {
        await transporter.sendMail({
            from: EMAIL_FROM,
            to,
            subject,
            html,
        });
        return true;
    } catch (error) {
        logger.error('Failed to send email:', error);
        return false;
    }
}

async function processReminders() {
    logger.info('Running cron job to check for payment reminders...');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    try {
        const reminders = await prisma.paymentReminder.findMany({
            where: {
                status: 'PENDING',
                dueDate: {
                    lte: today,
                },
                method: 'EMAIL',
            },
            include: {
                member: true,
                currency: true,
            },
        });

        for (const reminder of reminders) {
            const memberEmail = reminder.member.email;
            if (!memberEmail) {
                logger.warn(`Skipping reminder for member ${reminder.memberId}: no email address found.`);
                continue;
            }

            const subject = `${reminder.reminderType} Reminder`;
            const html = `
                <p>Hello ${reminder.member.firstName},</p>
                <p>This is a reminder that your payment of ${reminder.currency.symbol}${reminder.amount} is due on ${reminder.dueDate.toLocaleDateString()}.</p>
                <p>${reminder.message || ''}</p>
                <p>Thank you for your timely contribution.</p>
            `;

            const emailSent = await sendEmailReminder(memberEmail, subject, html);
            if (emailSent) {
                await prisma.paymentReminder.update({
                    where: { id: reminder.id },
                    data: { status: 'SENT', sentAt: now },
                });
                logger.info(`Reminder email sent for payment ID: ${reminder.id} to ${memberEmail}`);
            } else {
                await prisma.paymentReminder.update({
                    where: { id: reminder.id },
                    data: { status: 'FAILED' },
                });
                logger.error(`Failed to send reminder email for payment ID: ${reminder.id}`);
            }
        }
    } catch (error) {
        logger.error('Error in cron job processing reminders:', error);
    }
}

// Schedule the cron job to run every day at midnight.
cron.schedule('0 0 * * *', processReminders, {
    scheduled: true,
    timezone: "Africa/Harare",
});
logger.info('Payment reminder cron job scheduled to run daily at midnight.');

// --- Security Middleware ---
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    optionsSuccessStatus: 200,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(httpLogger);

// Rate limiters
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(apiLimiter);

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: MAX_LOGIN_ATTEMPTS * 2,
    message: { message: 'Too many login attempts from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/login', loginLimiter);

// --- Error Classes ---
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409);
    }
}

class ValidationError extends AppError {
    constructor(message = 'Invalid input data') {
        super(message, 400);
    }
}

class AuthError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401);
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Forbidden: Insufficient permissions') {
        super(message, 403);
    }
}

// --- Utility Functions ---
function generateAccessToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            roleId: user.roleId,
            roleName: user.role.name,
            branchCode: user.branchCode,
            permissions: user.role.permissions
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRATION }
    );
}

function generateRefreshToken(user) {
    return jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });
}

const logAudit = async (userId, username, action, tableName, recordId, oldValues = null, newValues = null, req = null) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                username,
                action,
                tableName,
                recordId: recordId.toString(),
                oldValues: oldValues ? JSON.stringify(oldValues) : null,
                newValues: newValues ? JSON.stringify(newValues) : null,
                ipAddress: req?.ip || req?.connection?.remoteAddress,
                userAgent: req?.get('User-Agent')
            }
        });
    } catch (error) {
        logger.error('Audit logging failed:', error);
    }
};

// --- Middleware ---
const authenticateToken = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthError('Authorization token missing or malformed.');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                throw new AuthError('Access token expired. Please refresh.');
            }
            throw new ForbiddenError('Invalid access token.');
        }

        try {
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                include: {
                    role: {
                        select: {
                            id: true,
                            name: true,
                            displayName: true,
                            permissions: true,
                            isActive: true
                        }
                    }
                }
            });

            if (!user) throw new AuthError('User not found.');
            if (!user.isActive) throw new ForbiddenError('User account is inactive.');
            if (user.locked) throw new ForbiddenError('User account is locked.');
            if (!user.role || !user.role.isActive) throw new ForbiddenError('User role is invalid or inactive.');

            req.user = {
                id: user.id,
                username: user.username,
                roleId: user.roleId,
                branchCode: user.branchCode,
                role: user.role
            };
            next();
        } catch (dbError) {
            logger.error('Database error during authentication:', dbError);
            throw new AuthError('Authentication failed.');
        }
    });
});

const checkPermission = (module, action) => {
    return (req, res, next) => {
        const user = req.user;

        if (!user || !user.role || !user.role.permissions) {
            return res.status(403).json({ error: 'Access denied. No permissions found.' });
        }

        const hasPermission = user.role.permissions[module]?.includes(action);

        if (!hasPermission) {
            logger.warn(`Access denied for user ${user.username}: Required permission ${module}:${action}`);
            return res.status(403).json({
                error: `Access denied. Required permission: ${module}:${action}`
            });
        }

        next();
    };
};

// --- Validation Schemas ---
const loginSchema = Joi.object({
    username: Joi.string().trim().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
});

const userCreateSchema = Joi.object({
    username: Joi.string().trim().min(3).max(30).required(),
    password: Joi.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[a-zA-Z\d!@#$%^&*()_+]{8,}$/).required(),
    firstName: Joi.string().trim().max(50).allow(''),
    lastName: Joi.string().trim().max(50).allow(''),
    email: Joi.string().email().allow('', null),
    phoneNumber: Joi.string().trim().max(20).allow(''),
    roleId: Joi.number().integer().positive().required(),
    branchCode: Joi.string().length(2).required(),
});

const userUpdateSchema = Joi.object({
    username: Joi.string().trim().min(3).max(30).optional(),
    firstName: Joi.string().trim().max(50).allow('').optional(),
    lastName: Joi.string().trim().max(50).allow('').optional(),
    email: Joi.string().email().allow('', null).optional(),
    phoneNumber: Joi.string().trim().max(20).allow('').optional(),
    roleId: Joi.number().integer().positive().optional(),
    branchCode: Joi.string().length(2).optional(),
    locked: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
    password: Joi.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[a-zA-Z\d!@#$%^&*()_+]{8,}$/).optional(),
});

const createRoleSchema = Joi.object({
    name: Joi.string().lowercase().pattern(/^[a-z_]+$/).min(2).max(50).required(),
    displayName: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).allow('', null),
    permissions: Joi.object({
        users: Joi.array().items(Joi.string().valid('read', 'create', 'update', 'delete', 'lock_unlock')).default([]),
        roles: Joi.array().items(Joi.string().valid('read', 'create', 'update', 'delete')).default([]),
        branches: Joi.array().items(Joi.string().valid('read', 'create', 'update', 'delete')).default([]),
        transactions: Joi.array().items(Joi.string().valid('read', 'create', 'update', 'delete', 'refund')).default([]),
        reports: Joi.array().items(Joi.string().valid('read', 'export', 'advanced')).default([]),
        settings: Joi.array().items(Joi.string().valid('read', 'update', 'system_config')).default([]),
        revenue_heads: Joi.array().items(Joi.string().valid('read', 'create', 'update', 'delete')).default([]),
        expenditure_heads: Joi.array().items(Joi.string().valid('read', 'create', 'update', 'delete')).default([]),
        currencies: Joi.array().items(Joi.string().valid('read', 'manage')).default([]),
        payment_methods: Joi.array().items(Joi.string().valid('read', 'manage')).default([]),
        members: Joi.array().items(Joi.string().valid('read', 'create', 'update', 'delete')).default([]),
        projects: Joi.array().items(Joi.string().valid('read', 'create', 'update', 'delete')).default([]),
        expenditures: Joi.array().items(Joi.string().valid('read', 'create', 'update', 'delete', 'approve')).default([]),
        assets: Joi.array().items(Joi.string().valid('read', 'create', 'update', 'delete')).default([]),
        suppliers: Joi.array().items(Joi.string().valid('read', 'create', 'update', 'delete')).default([]),
        contracts: Joi.array().items(Joi.string().valid('read', 'create', 'update', 'delete')).default([]),
        budgets: Joi.array().items(Joi.string().valid('read', 'create', 'update', 'delete')).default([])
    }).required(),
    isActive: Joi.boolean().default(true)
});

const updateRoleSchema = createRoleSchema.fork(Object.keys(createRoleSchema.describe().keys), (schema) => schema.optional());

const branchSchema = Joi.object({
    code: Joi.string().trim().length(2).required(),
    name: Joi.string().trim().min(3).max(100).required(),
    address: Joi.string().trim().max(200).allow('', null),
    phoneNumber: Joi.string().trim().max(20).allow('', null),
    isActive: Joi.boolean().default(true),
});

const revenueHeadSchema = Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().max(200).allow('', null),
    branchCode: Joi.string().trim().length(2).required(),
    isActive: Joi.boolean().default(true)
});

const expenditureHeadSchema = Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().max(200).allow('', null),
    category: Joi.string().valid('OPERATIONAL', 'PROJECT', 'CAPITAL', 'MAINTENANCE', 'UTILITIES', 'PERSONNEL', 'MINISTRY', 'OUTREACH', 'EMERGENCY', 'ADMINISTRATIVE').default('OPERATIONAL'),
    branchCode: Joi.string().trim().length(2).required(),
    budgetLimit: Joi.number().positive().precision(2).optional(),
    approvalRequired: Joi.boolean().default(false),
    isActive: Joi.boolean().default(true)
});

const memberCreateSchema = Joi.object({
    memberNumber: Joi.string().trim().min(3).max(20).required(),
    firstName: Joi.string().trim().min(1).max(50).required(),
    lastName: Joi.string().trim().min(1).max(50).required(),
    dateOfBirth: Joi.date().max('now').allow(null),
    ageCategory: Joi.string().valid('ADULT', 'YOUTH', 'CHILD', 'ELDERLY').default('ADULT'),
    phoneNumber: Joi.string().trim().max(20).allow('', null),
    email: Joi.string().email().allow('', null),
    address: Joi.string().trim().max(500).allow('', null),
    branchCode: Joi.string().length(2).required(),
    isActive: Joi.boolean().default(true)
});

const memberUpdateSchema = memberCreateSchema.fork(Object.keys(memberCreateSchema.describe().keys), (schema) => schema.optional());

const projectCreateSchema = Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().max(500).allow('', null),
    targetAmount: Joi.number().positive().precision(2).required(),
    currencyCode: Joi.string().length(3).default('USD'),
    branchCode: Joi.string().length(2).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).allow(null),
    status: Joi.string().valid('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED').default('PLANNING'),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').default('MEDIUM'),
    isActive: Joi.boolean().default(true)
});

const projectUpdateSchema = projectCreateSchema.fork(Object.keys(projectCreateSchema.describe().keys), (schema) => schema.optional());

const memberProjectSchema = Joi.object({
    memberId: Joi.number().integer().positive().required(),
    projectId: Joi.number().integer().positive().required(),
    requiredAmount: Joi.number().positive().precision(2).optional(),
    currencyCode: Joi.string().length(3).optional(),
});

const contributionCreateSchema = Joi.object({
    memberId: Joi.number().integer().positive().required(),
    projectId: Joi.number().integer().positive().required(),
    amount: Joi.number().positive().precision(2).required(),
    currencyCode: Joi.string().length(3).default('USD'),
    paymentMethodId: Joi.number().integer().positive().required(),
    referenceNumber: Joi.string().trim().max(50).allow('', null),
    notes: Joi.string().trim().max(500).allow('', null),
    paymentDate: Joi.date().default(() => new Date())
});

const transactionCreateSchema = Joi.object({
    memberId: Joi.number().integer().positive().required(),
    revenueHeadCode: Joi.string().required(),
    amount: Joi.number().positive().precision(2).required(),
    currencyCode: Joi.string().length(3).default('USD'),
    paymentMethodId: Joi.number().integer().positive().required(),
    referenceNumber: Joi.string().trim().max(50).allow('', null),
    notes: Joi.string().trim().max(500).allow('', null),
    transactionDate: Joi.date().default(() => new Date())
});

const expenditureCreateSchema = Joi.object({
    expenditureHeadCode: Joi.string().required(),
    projectId: Joi.number().integer().positive().allow(null),
    supplierId: Joi.number().integer().positive().allow(null),
    description: Joi.string().trim().min(3).max(500).required(),
    amount: Joi.number().positive().precision(2).required(),
    taxAmount: Joi.number().min(0).precision(2).default(0),
    currencyCode: Joi.string().length(3).default('USD'),
    paymentMethodId: Joi.number().integer().positive().required(),
    referenceNumber: Joi.string().trim().max(50).allow('', null),
    branchCode: Joi.string().length(2).required(),
    expenseDate: Joi.date().default(() => new Date()),
    dueDate: Joi.date().allow(null),
    urgency: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'CRITICAL', 'EMERGENCY').default('NORMAL'),
    isReimbursement: Joi.boolean().default(false),
    reimbursedTo: Joi.number().integer().positive().allow(null),
    notes: Joi.string().trim().max(500).allow('', null)
});

const expenditureUpdateSchema = expenditureCreateSchema.fork(Object.keys(expenditureCreateSchema.describe().keys), (schema) => schema.optional());

const supplierCreateSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    businessName: Joi.string().trim().max(100).allow('', null),
    contactPerson: Joi.string().trim().max(100).allow('', null),
    email: Joi.string().email().allow('', null),
    phoneNumber: Joi.string().trim().max(20).allow('', null),
    address: Joi.string().trim().max(500).allow('', null),
    taxNumber: Joi.string().trim().max(50).allow('', null),
    bankAccount: Joi.string().trim().max(50).allow('', null),
    paymentTerms: Joi.number().integer().positive().default(30),
    creditLimit: Joi.number().positive().precision(2).allow(null),
    supplierType: Joi.string().valid('VENDOR', 'CONTRACTOR', 'SERVICE_PROVIDER', 'CONSULTANT', 'UTILITY_COMPANY', 'GOVERNMENT_AGENCY').default('VENDOR'),
    notes: Joi.string().trim().max(500).allow('', null)
});

const supplierUpdateSchema = supplierCreateSchema.fork(Object.keys(supplierCreateSchema.describe().keys), (schema) => schema.optional());

const assetCreateSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().trim().max(500).allow('', null),
    category: Joi.string().valid('FURNITURE', 'EQUIPMENT', 'ELECTRONICS', 'VEHICLES', 'PROPERTY', 'INSTRUMENTS', 'SOFTWARE', 'OTHER').required(),
    expenditureId: Joi.number().integer().positive().allow(null),
    branchCode: Joi.string().length(2).required(),
    purchasePrice: Joi.number().positive().precision(2).required(),
    currencyCode: Joi.string().length(3).default('USD'),
    purchaseDate: Joi.date().required(),
    warrantyExpiry: Joi.date().allow(null),
    condition: Joi.string().valid('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'OBSOLETE').default('EXCELLENT'),
    location: Joi.string().trim().max(100).allow('', null),
    assignedTo: Joi.number().integer().positive().allow(null),
    depreciationRate: Joi.number().min(0).max(100).precision(2).allow(null),
    isInsured: Joi.boolean().default(false),
    insuranceExpiry: Joi.date().allow(null),
    serialNumber: Joi.string().trim().max(50).allow('', null),
    barcode: Joi.string().trim().max(50).allow('', null)
});

const assetUpdateSchema = assetCreateSchema.fork(Object.keys(assetCreateSchema.describe().keys), (schema) => schema.optional());

const contractCreateSchema = Joi.object({
    supplierId: Joi.number().integer().positive().required(),
    projectId: Joi.number().integer().positive().allow(null),
    title: Joi.string().trim().min(3).max(200).required(),
    description: Joi.string().trim().max(1000).allow('', null),
    contractValue: Joi.number().positive().precision(2).required(),
    currencyCode: Joi.string().length(3).default('USD'),
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).required(),
    contractType: Joi.string().valid('SERVICE', 'SUPPLY', 'CONSTRUCTION', 'MAINTENANCE', 'CONSULTING', 'LEASE', 'OTHER').required(),
    paymentTerms: Joi.string().trim().max(500).allow('', null),
    deliverables: Joi.string().trim().max(1000).allow('', null),
    penalties: Joi.string().trim().max(500).allow('', null)
});

const contractUpdateSchema = contractCreateSchema.fork(Object.keys(contractCreateSchema.describe().keys), (schema) => schema.optional());

const budgetPeriodCreateSchema = Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).required(),
    budgetType: Joi.string().valid('ANNUAL', 'QUARTERLY', 'MONTHLY', 'PROJECT_BASED', 'EVENT_BASED').default('ANNUAL'),
    totalBudget: Joi.number().positive().precision(2).required(),
    currencyCode: Joi.string().length(3).default('USD')
});

const budgetPeriodUpdateSchema = budgetPeriodCreateSchema.fork(Object.keys(budgetPeriodCreateSchema.describe().keys), (schema) => schema.optional());

const budgetLineSchema = Joi.object({
    expenditureHeadCode: Joi.string().required(),
    projectId: Joi.number().integer().positive().allow(null),
    budgetedAmount: Joi.number().positive().precision(2).required(),
    notes: Joi.string().trim().max(500).allow('', null).optional()
});

const currencySchema = Joi.object({
    code: Joi.string().trim().length(3).uppercase().required(),
    name: Joi.string().trim().min(3).max(50).required(),
    symbol: Joi.string().trim().max(5).allow('', null),
    decimalPlaces: Joi.number().integer().min(0).max(6).default(2),
    isActive: Joi.boolean().default(true)
});

const paymentMethodSchema = Joi.object({
    name: Joi.string().trim().min(3).max(50).required(),
    description: Joi.string().trim().max(200).allow('', null),
    isActive: Joi.boolean().default(true)
});

const passwordResetRequestSchema = Joi.object({
    username: Joi.string().trim().min(3).max(30).required(),
});

const passwordResetSchema = Joi.object({
    token: Joi.string().trim().length(64).required(),
    newPassword: Joi.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[a-zA-Z\d!@#$%^&*()_+]{8,}$/).required(),
});

// --- Helper Functions ---
function calculateAgeCategory(dateOfBirth) {
    const age = Math.floor((new Date() - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 13) return 'CHILD';
    if (age < 18) return 'YOUTH';
    if (age >= 65) return 'ELDERLY';
    return 'ADULT';
}


const printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,  // Epson or Star
  interface: 'usb',          // or 'tcp://IP_ADDRESS'
  options: { timeout: 5000 }
});

async function generateReceiptNumber(type, branchCode, tx) {
    const currentYear = new Date().getFullYear();
    const prefix = type === 'contribution' ? 'MC' : type === 'transaction' ? 'TR' : 'EX';

    const whereClause = type === 'contribution'
        ? {
            paymentDate: {
                gte: new Date(currentYear, 0, 1),
                lt: new Date(currentYear + 1, 0, 1),
            }
        }
        : type === 'transaction'
            ? {
                transactionDate: {
                    gte: new Date(currentYear, 0, 1),
                    lt: new Date(currentYear + 1, 0, 1),
                },
                branchCode
            }
            : {
                expenseDate: {
                    gte: new Date(currentYear, 0, 1),
                    lt: new Date(currentYear + 1, 0, 1),
                },
                branchCode
            };

    const lastRecord = await (type === 'contribution'
        ? tx.memberContribution.findFirst({
            where: whereClause,
            orderBy: { receiptNumber: 'desc' },
            select: { receiptNumber: true }
        })
        : type === 'transaction'
            ? tx.transaction.findFirst({
                where: whereClause,
                orderBy: { receiptNumber: 'desc' },
                select: { receiptNumber: true }
            })
            : tx.expenditure.findFirst({
                where: whereClause,
                orderBy: { voucherNumber: 'desc' },
                select: { voucherNumber: true }
            }));

    let nextSequence = 1;
    if (lastRecord) {
        const receiptNum = type === 'expenditure' ? lastRecord.voucherNumber : lastRecord.receiptNumber;
        if (receiptNum && receiptNum.includes(`-${prefix}-`)) {
            const parts = receiptNum.split(`-${prefix}-`);
            if (parts.length === 2) {
                const lastSequence = parseInt(parts[1], 10);
                nextSequence = lastSequence + 1;
            }
        }
    }

    return `${branchCode}-${prefix}-${currentYear}-${String(nextSequence).padStart(6, '0')}`;
}

async function generateUniqueCode(tx, table, prefix, length = 3, branchCode = null) {
    let whereClause = {};
    if (branchCode) {
        whereClause.branchCode = branchCode;
    }

    const count = await tx[table].count({ where: whereClause });
    const sequence = String(count + 1).padStart(length, '0');
    return `${prefix}${sequence}`;
}

// --- Initial Setup ---
(async () => {
    try {      //QZ tray setup initialization
        
        
        await prisma.$connect();
        logger.info('Connected to PostgreSQL database via Prisma!');

        // Check if we need to initialize default data
        const userCount = await prisma.user.count();
        const shouldInitialize = userCount === 0;

        if (shouldInitialize) {
            logger.info('Initializing default system data...');

            // 1. Create default currencies
            const defaultCurrencies = [
                { code: 'ZIG', name: 'Zimbabwe Gold', symbol: 'ZIG', isBaseCurrency: true },
                { code: 'USD', name: 'US Dollar', symbol: '$' },
                { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
                { code: 'GBP', name: 'British Pound', symbol: '£' },
                { code: 'ZWL', name: 'Zimbabwe Dollar', symbol: 'ZWL' }
            ];

            await prisma.currency.createMany({
                data: defaultCurrencies,
                skipDuplicates: true
            });
            logger.info('Default currencies initialized');

            // 2. Create default payment methods
            const defaultPaymentMethods = [
                { name: 'Cash', description: 'Physical cash payment' },
                { name: 'Ecocash', description: 'Ecocash mobile money' },
                { name: 'One Money', description: 'One Money mobile money' },
                { name: 'Telecash', description: 'Telecel mobile money' },
                { name: 'Bank Transfer', description: 'Direct bank transfer' },
                { name: 'Card Swipe', description: 'Card payment via POS' },
                { name: 'PayPal', description: 'PayPal online payment' }
            ];

            await prisma.paymentMethod.createMany({
                data: defaultPaymentMethods,
                skipDuplicates: true
            });
            logger.info('Default payment methods initialized');

            // 3. Create default branch (Head Office)
            const defaultBranch = await prisma.branch.upsert({
                where: { code: DEFAULT_ADMIN_BRANCH },
                update: {},
                create: {
                    code: DEFAULT_ADMIN_BRANCH,
                    name: 'Head Office',
                    isActive: true
                }
            });
            logger.info(`Default branch created: ${defaultBranch.name}`);

            // 4. Create default revenue heads for head office
            const defaultRevenueHeads = [
                { name: 'Tithes', branchCode: DEFAULT_ADMIN_BRANCH },
                { name: 'Pledges', branchCode: DEFAULT_ADMIN_BRANCH },
                { name: 'Offerings', branchCode: DEFAULT_ADMIN_BRANCH },
                { name: 'Seeds', branchCode: DEFAULT_ADMIN_BRANCH },
                { name: 'Donations', branchCode: DEFAULT_ADMIN_BRANCH }
            ];

            await Promise.all(defaultRevenueHeads.map(async (head, index) => {
                const code = `${DEFAULT_ADMIN_BRANCH}R${String(index + 1).padStart(3, '0')}`;
                await prisma.revenueHead.upsert({
                    where: { code },
                    update: {},
                    create: {
                        code,
                        name: head.name,
                        branchCode: head.branchCode,
                        isActive: true
                    }
                });
            }));
            logger.info('Default revenue heads initialized');

            // 5. Create default expenditure heads for head office
            const defaultExpenditureHeads = [
                { name: 'Salaries', category: 'PERSONNEL', branchCode: DEFAULT_ADMIN_BRANCH },
                { name: 'Utilities', category: 'UTILITIES', branchCode: DEFAULT_ADMIN_BRANCH },
                { name: 'Maintenance', category: 'MAINTENANCE', branchCode: DEFAULT_ADMIN_BRANCH },
                { name: 'Office Supplies', category: 'ADMINISTRATIVE', branchCode: DEFAULT_ADMIN_BRANCH },
                { name: 'Travel', category: 'OPERATIONAL', branchCode: DEFAULT_ADMIN_BRANCH }
            ];

            await Promise.all(defaultExpenditureHeads.map(async (head, index) => {
                const code = `${DEFAULT_ADMIN_BRANCH}E${String(index + 1).padStart(3, '0')}`;
                await prisma.expenditureHead.upsert({
                    where: { code },
                    update: {},
                    create: {
                        code,
                        name: head.name,
                        category: head.category,
                        branchCode: head.branchCode,
                        isActive: true
                    }
                });
            }));
            logger.info('Default expenditure heads initialized');

            // 6. Create admin role with full permissions
            const adminRole = await prisma.role.upsert({
                where: { name: 'admin' },
                update: {},
                create: {
                    name: 'admin',
                    displayName: 'Administrator',
                    description: 'Full system access with all permissions',
                    permissions: {
                        users: ['read', 'create', 'update', 'delete', 'lock_unlock'],
                        roles: ['read', 'create', 'update', 'delete'],
                        branches: ['read', 'create', 'update', 'delete'],
                        transactions: ['read', 'create', 'update', 'delete', 'refund'],
                        reports: ['read', 'export', 'advanced'],
                        settings: ['read', 'update', 'system_config'],
                        revenue_heads: ['read', 'create', 'update', 'delete'],
                        expenditure_heads: ['read', 'create', 'update', 'delete'],
                        currencies: ['read', 'manage'],
                        payment_methods: ['read', 'manage'],
                        members: ['read', 'create', 'update', 'delete'],
                        projects: ['read', 'create', 'update', 'delete'],
                        expenditures: ['read', 'create', 'update', 'delete', 'approve'],
                        assets: ['read', 'create', 'update', 'delete'],
                        suppliers: ['read', 'create', 'update', 'delete'],
                        contracts: ['read', 'create', 'update', 'delete'],
                        budgets: ['read', 'create', 'update', 'delete']
                    },
                    isActive: true
                }
            });
            logger.info('Admin role created');

            // 7. Create default admin user
            if (DEFAULT_ADMIN_USERNAME && DEFAULT_ADMIN_PASSWORD) {
                const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);
                const defaultAdmin = await prisma.user.upsert({
                    where: { username: DEFAULT_ADMIN_USERNAME },
                    update: {},
                    create: {
                        username: DEFAULT_ADMIN_USERNAME,
                        password_hash: hashedPassword,
                        firstName: 'System',
                        lastName: 'Administrator',
                        roleId: adminRole.id,
                        branchCode: DEFAULT_ADMIN_BRANCH,
                        isActive: true,
                        createdBy: 'system'
                    }
                });
                logger.info(`Default admin user created: ${defaultAdmin.username}`);
                logger.warn('IMPORTANT: Change the default admin password immediately after first login!');
            }

            // 8. Create standard roles
            const standardRoles = [
                {
                    name: 'supervisor',
                    displayName: 'Supervisor',
                    description: 'Branch supervisor with elevated permissions',
                    permissions: {
                        users: ['read', 'create', 'update', 'lock_unlock'],
                        branches: ['read'],
                        transactions: ['read', 'create', 'update', 'refund'],
                        reports: ['read', 'export'],
                        revenue_heads: ['read', 'create'],
                        expenditure_heads: ['read', 'create'],
                        members: ['read', 'create', 'update'],
                        projects: ['read', 'create', 'update'],
                        expenditures: ['read', 'create', 'update'],
                        assets: ['read', 'create', 'update'],
                        suppliers: ['read', 'create', 'update'],
                        contracts: ['read', 'create', 'update']
                    }
                },
                {
                    name: 'cashier',
                    displayName: 'Cashier',
                    description: 'Standard cashier with basic permissions',
                    permissions: {
                        users: ['read'],
                        branches: ['read'],
                        transactions: ['read', 'create'],
                        reports: ['read'],
                        revenue_heads: ['read'],
                        expenditure_heads: ['read'],
                        members: ['read', 'create'],
                        projects: ['read'],
                        expenditures: ['read'],
                        assets: ['read'],
                        suppliers: ['read']
                    }
                }
            ];

            await prisma.role.createMany({
                data: standardRoles,
                skipDuplicates: true
            });
            logger.info('Standard roles initialized');
        }
    } catch (error) {
        logger.fatal({ error }, 'Failed to connect to DB or perform initial setup.');
        process.exit(1);
    }
})();

// Load QZ Tray certificates


app.post('/print-receipt', async (req, res) => {
  const { formattedReceipt } = req.body; // HTML/text from receiptline

  try {
    printer.clear();
    printer.println(formattedReceipt); // Send receipt text to printer
    printer.cut();

    await printer.execute();
    res.json({ success: true, message: 'Receipt printed successfully' });
  } catch (err) {
    console.error('Printing error:', err);
    res.status(500).json({ success: false, message: 'Printing failed', error: err.message });
  }
})


try {
    if (fs.existsSync(certPath)) {
        certificate = fs.readFileSync(certPath, 'utf8');
        logger.info('QZ Tray certificate loaded successfully');
    } else {
        logger.warn('QZ Tray certificate file not found at:', certPath);
    }

    if (fs.existsSync(keyPath)) {
        privateKey = fs.readFileSync(keyPath, 'utf8');
        logger.info('QZ Tray private key loaded successfully');
    } else {
        logger.warn('QZ Tray private key file not found at:', keyPath);
    }
} catch (error) {
    logger.error('Error loading QZ Tray certificates:', error);
}

// --- AUTHENTICATION ROUTES ---

// Login
app.post('/api/login', asyncHandler(async (req, res) => {
    const { error, value } = loginSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const { username, password } = value;

    const user = await prisma.user.findUnique({
        where: { username },
        include: {
            role: {
                select: {
                    id: true,
                    name: true,
                    displayName: true,
                    permissions: true,
                    isActive: true
                }
            }
        }
    });

    let loginSuccessful = false;

    try {
        if (!user) throw new AuthError('Invalid username or password.');
        if (user.locked) throw new ForbiddenError('Account locked. Contact administrator.');
        if (!user.isActive) throw new ForbiddenError('Account is inactive. Contact administrator.');
        if (!user.role || !user.role.isActive) throw new ForbiddenError('User role is invalid or inactive.');

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        await prisma.$transaction(async (tx) => {
            if (!isPasswordValid) {
                const newAttempts = user.attempts + 1;
                let updateData = { attempts: newAttempts };
                let msg = 'Invalid password.';

                if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
                    updateData.locked = true;
                    msg = 'Account locked due to multiple failed attempts. Contact administrator.';
                }

                await tx.loginHistory.create({
                    data: {
                        userId: user.id,
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent'),
                        success: false
                    }
                });

                await tx.user.update({ where: { id: user.id }, data: updateData });
                throw new AuthError(msg);
            }

            loginSuccessful = true;

            await tx.loginHistory.create({
                data: {
                    userId: user.id,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    success: true
                }
            });

            await tx.user.update({
                where: { id: user.id },
                data: {
                    attempts: 0,
                    lastLogin: new Date()
                }
            });
        });

        const branch = await prisma.branch.findUnique({ where: { code: user.branchCode } });
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + ms(REFRESH_TOKEN_EXPIRATION)),
            },
        });

        res.status(200).json({
            message: 'Login successful.',
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                roleId: user.roleId,
                branchCode: user.branchCode,
                role: user.role,
                branchName: branch ? branch.name : 'Unknown Branch',
            },
        });
    } catch (error) {
        if (!loginSuccessful && user) {
            await prisma.loginHistory.create({
                data: {
                    userId: user.id,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    success: false,
                    error: error.message
                }
            });
        }
        throw error;
    }
}));

// Refresh Token
app.post('/api/refresh-token', asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AuthError('Refresh token is required.');

    const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: {
            user: {
                include: {
                    role: {
                        select: {
                            id: true,
                            name: true,
                            displayName: true,
                            permissions: true,
                            isActive: true
                        }
                    }
                }
            }
        },
    });

    if (!storedToken) throw new AuthError('Invalid refresh token. Please login again.');
    if (new Date() > storedToken.expiresAt) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
        throw new AuthError('Expired refresh token. Please login again.');
    }

    jwt.verify(refreshToken, REFRESH_SECRET, async (err, decoded) => {
        if (err || decoded.id !== storedToken.userId) {
            await prisma.refreshToken.delete({ where: { id: storedToken.id } });
            throw new AuthError('Invalid refresh token. Please login again.');
        }

        const newAccessToken = generateAccessToken(storedToken.user);
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
        const newRefreshToken = generateRefreshToken(storedToken.user);
        await prisma.refreshToken.create({
            data: {
                token: newRefreshToken,
                userId: storedToken.user.id,
                expiresAt: new Date(Date.now() + ms(REFRESH_TOKEN_EXPIRATION)),
            },
        });
        res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    });
}));

// Logout
app.post('/api/logout', authenticateToken, asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await prisma.refreshToken.deleteMany({
            where: {
                token: refreshToken,
                userId: req.user.id,
            },
        });
    }
    res.status(200).json({ message: 'Logged out successfully.' });
}));

// --- USER MANAGEMENT ROUTES ---

// Create User
app.post('/api/users', authenticateToken, checkPermission('users', 'create'), asyncHandler(async (req, res) => {
    const { error, value } = userCreateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const { username, password, roleId, branchCode } = value;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) throw new ConflictError('Username already exists.');

    // Verify role and branch exist
    const [roleExists, branchExists] = await Promise.all([
        prisma.role.findUnique({ where: { id: roleId } }),
        prisma.branch.findUnique({ where: { code: branchCode } })
    ]);

    if (!roleExists) throw new NotFoundError('Role not found.');
    if (!branchExists) throw new NotFoundError('Branch not found.');

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
        data: {
            ...value,
            password_hash: hashedPassword,
            createdBy: req.user.username,
            isActive: true
        },
        select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            roleId: true,
            branchCode: true,
            isActive: true,
            createdAt: true
        }
    });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'users', newUser.id, null, newUser, req);

    res.status(201).json({
        message: 'User created successfully.',
        user: newUser,
    });
}));

// Get Users
app.get('/api/users', authenticateToken, checkPermission('users', 'read'), asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0, branchCode, roleId, isActive, search } = req.query;

    const take = parseInt(limit, 10);
    const skip = parseInt(offset, 10);

    let whereClause = {};

    if (branchCode) whereClause.branchCode = branchCode;
    if (roleId) whereClause.roleId = parseInt(roleId, 10);
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    if (search) {
        whereClause.OR = [
            { username: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
        ];
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where: whereClause,
            take,
            skip,
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                roleId: true,
                branchCode: true,
                locked: true,
                attempts: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                createdBy: true,
                role: { select: { displayName: true } },
                branch: { select: { name: true } }
            },
            orderBy: { username: 'asc' }
        }),
        prisma.user.count({ where: whereClause })
    ]);

    res.status(200).json({
        total,
        limit: take,
        offset: skip,
        users
    });
}));

// Get User by ID
app.get('/api/users/:id', authenticateToken, asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) throw new ValidationError('Invalid user ID.');

    if (req.user.id !== userId && !req.user.role.permissions.users?.includes('read')) {
        throw new ForbiddenError('You are not authorized to view this user profile.');
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            roleId: true,
            branchCode: true,
            locked: true,
            attempts: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
            createdBy: true,
            role: { select: { displayName: true } },
            branch: { select: { name: true } }
        }
    });

    if (!user) throw new NotFoundError('User not found.');
    res.status(200).json(user);
}));

// Update User
app.patch('/api/users/:id', authenticateToken, asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) throw new ValidationError('Invalid user ID.');

    const { error, value } = userUpdateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) throw new NotFoundError('User not found.');

    // Check permissions
    if (req.user.id !== userId && !req.user.role.permissions.users?.includes('update')) {
        throw new ForbiddenError('You are not authorized to update this user.');
    }

    // Prevent changing own role or lock status
    if (req.user.id === userId && (value.roleId || value.locked !== undefined || value.isActive !== undefined)) {
        throw new ForbiddenError('You cannot modify your own role or status.');
    }

    // If username is being updated, check for conflict
    if (value.username && value.username !== userExists.username) {
        const existingUser = await prisma.user.findUnique({ where: { username: value.username } });
        if (existingUser) throw new ConflictError('New username already exists.');
    }

    // If password is being updated, hash it
    if (value.password) {
        value.password_hash = await bcrypt.hash(value.password, 12);
        delete value.password;
    }

    const oldUser = { ...userExists };
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            ...value,
            ...(value.locked !== undefined && { attempts: 0 })
        },
        select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            roleId: true,
            branchCode: true,
            locked: true,
            attempts: true,
            isActive: true
        }
    });

    await logAudit(req.user.id, req.user.username, 'UPDATE', 'users', updatedUser.id, oldUser, updatedUser, req);

    res.status(200).json({ message: 'User updated successfully.', user: updatedUser });
}));

// Delete User
app.delete('/api/users/:id', authenticateToken, checkPermission('users', 'delete'), asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) throw new ValidationError('Invalid user ID.');

    if (req.user.id === userId) {
        throw new ForbiddenError('You cannot delete your own account.');
    }

    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) throw new NotFoundError('User not found.');

    await prisma.$transaction(async (tx) => {
        await tx.refreshToken.deleteMany({ where: { userId } });
        await tx.user.delete({ where: { id: userId } });
    });

    await logAudit(req.user.id, req.user.username, 'DELETE', 'users', userId, userExists, null, req);

    res.status(204).send();
}));

// --- ROLE MANAGEMENT ROUTES ---

// Create Role
app.post('/api/roles', authenticateToken, checkPermission('roles', 'create'), asyncHandler(async (req, res) => {
    const { error, value } = createRoleSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const existingRole = await prisma.role.findUnique({ where: { name: value.name } });
    if (existingRole) throw new ConflictError('Role name already exists.');

    const newRole = await prisma.role.create({ data: value });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'roles', newRole.id, null, newRole, req);

    res.status(201).json(newRole);
}));

// Get Roles
app.get('/api/roles', authenticateToken, checkPermission('roles', 'read'), asyncHandler(async (req, res) => {
    const roles = await prisma.role.findMany({
        orderBy: [
            { isActive: 'desc' },
            { displayName: 'asc' }
        ],
        include: {
            _count: {
                select: { users: true }
            }
        }
    });

    const rolesWithUserCount = roles.map(role => ({
        ...role,
        userCount: role._count.users
    }));

    res.status(200).json(rolesWithUserCount);
}));

// Update Role
app.patch('/api/roles/:id', authenticateToken, checkPermission('roles', 'update'), asyncHandler(async (req, res) => {
    const roleId = parseInt(req.params.id, 10);
    if (isNaN(roleId)) throw new ValidationError('Invalid role ID.');

    const { error, value } = updateRoleSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const existingRole = await prisma.role.findUnique({ where: { id: roleId } });
    if (!existingRole) throw new NotFoundError('Role not found.');

    if (value.name && value.name !== existingRole.name) {
        const conflictingRole = await prisma.role.findUnique({ where: { name: value.name } });
        if (conflictingRole) throw new ConflictError('Role name already exists.');
    }

    const oldRole = { ...existingRole };
    const updatedRole = await prisma.role.update({
        where: { id: roleId },
        data: value
    });

    await logAudit(req.user.id, req.user.username, 'UPDATE', 'roles', updatedRole.id, oldRole, updatedRole, req);

    res.status(200).json(updatedRole);
}));

// Delete Role
app.delete('/api/roles/:id', authenticateToken, checkPermission('roles', 'delete'), asyncHandler(async (req, res) => {
    const roleId = parseInt(req.params.id, 10);
    if (isNaN(roleId)) throw new ValidationError('Invalid role ID.');

    const existingRole = await prisma.role.findUnique({
        where: { id: roleId },
        include: { _count: { select: { users: true } } }
    });

    if (!existingRole) throw new NotFoundError('Role not found.');
    if (existingRole._count.users > 0) throw new ConflictError('Cannot delete role that has users assigned.');

    const systemRoles = ['admin', 'supervisor', 'cashier'];
    if (systemRoles.includes(existingRole.name)) {
        throw new ConflictError('Cannot delete system roles');
    }

    await prisma.role.delete({ where: { id: roleId } });

    await logAudit(req.user.id, req.user.username, 'DELETE', 'roles', roleId, existingRole, null, req);

    res.status(200).json({ message: 'Role deleted successfully' });
}));

// --- BRANCH MANAGEMENT ROUTES ---

// Create Branch
app.post('/api/branches', authenticateToken, checkPermission('branches', 'create'), asyncHandler(async (req, res) => {
    const { error, value } = branchSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const { code, name } = value;

    const existingBranch = await prisma.branch.findFirst({
        where: { OR: [{ code }, { name }] },
    });

    if (existingBranch) {
        if (existingBranch.code === code) throw new ConflictError('Branch code already exists.');
        if (existingBranch.name === name) throw new ConflictError('Branch name already exists.');
    }

    const newBranch = await prisma.branch.create({ data: value });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'branches', newBranch.code, null, newBranch, req);

    res.status(201).json(newBranch);
}));

// Get Branches
app.get('/api/branches', authenticateToken, checkPermission('branches', 'read'), asyncHandler(async (req, res) => {
    const branches = await prisma.branch.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: {
                    users: true,
                    members: true,
                    projects: true,
                    transactions: true
                }
            }
        }
    });

    res.status(200).json(branches);
}));

// Update Branch
app.patch('/api/branches/:code', authenticateToken, checkPermission('branches', 'update'), asyncHandler(async (req, res) => {
    const { code } = req.params;
    const { error, value } = branchSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const existingBranch = await prisma.branch.findUnique({ where: { code } });
    if (!existingBranch) throw new NotFoundError('Branch not found.');

    if (value.name && value.name !== existingBranch.name) {
        const nameConflict = await prisma.branch.findFirst({
            where: { name: value.name, NOT: { code: code } }
        });
        if (nameConflict) throw new ConflictError('Branch with this name already exists.');
    }

    const oldBranch = { ...existingBranch };
    const updatedBranch = await prisma.branch.update({
        where: { code },
        data: value
    });

    await logAudit(req.user.id, req.user.username, 'UPDATE', 'branches', updatedBranch.code, oldBranch, updatedBranch, req);

    res.status(200).json(updatedBranch);
}));

// Delete Branch
app.delete('/api/branches/:code', authenticateToken, checkPermission('branches', 'delete'), asyncHandler(async (req, res) => {
    const { code } = req.params;
    const existingBranch = await prisma.branch.findUnique({
        where: { code },
        include: {
            _count: {
                select: {
                    users: true, members: true, projects: true,
                    transactions: true, expenditures: true, revenueHeads: true,
                    expenditureHeads: true, assets: true
                }
            }
        }
    });

    if (!existingBranch) throw new NotFoundError('Branch not found.');

    const hasDependencies = Object.values(existingBranch._count).some(count => count > 0);
    if (hasDependencies) {
        throw new ConflictError('Cannot delete branch with associated records (users, members, projects, etc.).');
    }

    await prisma.branch.delete({ where: { code } });

    await logAudit(req.user.id, req.user.username, 'DELETE', 'branches', code, existingBranch, null, req);

    res.status(200).json({ message: 'Branch deleted successfully.' });
}));


// --- MEMBER MANAGEMENT ROUTES ---

// Create Member
app.post('/api/members', authenticateToken, checkPermission('members', 'create'), asyncHandler(async (req, res) => {
    const { error, value } = memberCreateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const { memberNumber, branchCode } = value;

    // Check if member number already exists
    const existingMember = await prisma.member.findUnique({ where: { memberNumber } });
    if (existingMember) throw new ConflictError('Member number already exists.');

    // Verify branch exists
    const branchExists = await prisma.branch.findUnique({ where: { code: branchCode } });
    if (!branchExists) throw new NotFoundError('Branch not found.');

    // Auto-calculate age category if dateOfBirth provided
    if (value.dateOfBirth && !req.body.ageCategory) {
        value.ageCategory = calculateAgeCategory(value.dateOfBirth);
    }

    const newMember = await prisma.member.create({
        data: value,
        include: {
            branch: { select: { name: true } }
        }
    });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'members', newMember.id, null, newMember, req);

    res.status(201).json({
        message: 'Member created successfully.',
        member: newMember
    });
}));

// Get Members
app.get('/api/members', authenticateToken, checkPermission('members', 'read'), asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0, branchCode, ageCategory, isActive, search } = req.query;

    const take = parseInt(limit, 10);
    const skip = parseInt(offset, 10);

    let whereClause = {};

    // Branch restriction for non-admin users
    if (!req.user.role.permissions.members?.includes('read_all')) {
        whereClause.branchCode = req.user.branchCode;
    } else if (branchCode) {
        whereClause.branchCode = branchCode;
    }

    if (ageCategory) whereClause.ageCategory = ageCategory;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    // Search functionality
    if (search) {
        whereClause.OR = [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { memberNumber: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
        ];
    }

    const [members, total] = await Promise.all([
        prisma.member.findMany({
            where: whereClause,
            take,
            skip,
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
            include: {
                branch: { select: { name: true } },
                _count: {
                    select: {
                        contributions: true,
                        memberProjects: true,
                        generalTransactions: true
                    }
                }
            }
        }),
        prisma.member.count({ where: whereClause })
    ]);

    res.status(200).json({
        total,
        limit: take,
        offset: skip,
        members
    });
}));

// Get Member by ID
app.get('/api/members/:id', authenticateToken, checkPermission('members', 'read'), asyncHandler(async (req, res) => {
    const memberId = parseInt(req.params.id, 10);
    if (isNaN(memberId)) throw new ValidationError('Invalid member ID.');

    const member = await prisma.member.findUnique({
        where: { id: memberId },
        include: {
            branch: { select: { name: true, code: true } }
        }
    });

    if (!member) throw new NotFoundError('Member not found.');

    if (member.branchCode !== req.user.branchCode && !req.user.role.permissions.members?.includes('read_all')) {
        throw new ForbiddenError('You can only view members in your own branch.');
    }

    res.status(200).json(member);
}));

// Update Member
app.patch('/api/members/:id', authenticateToken, checkPermission('members', 'update'), asyncHandler(async (req, res) => {
    const memberId = parseInt(req.params.id, 10);
    if (isNaN(memberId)) throw new ValidationError('Invalid member ID.');

    const { error, value } = memberUpdateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const existingMember = await prisma.member.findUnique({ where: { id: memberId } });
    if (!existingMember) throw new NotFoundError('Member not found.');

    if (existingMember.branchCode !== req.user.branchCode && !req.user.role.permissions.members?.includes('update_all')) {
        throw new ForbiddenError('You can only update members in your own branch.');
    }

    if (value.memberNumber && value.memberNumber !== existingMember.memberNumber) {
        const conflict = await prisma.member.findUnique({ where: { memberNumber: value.memberNumber } });
        if (conflict) throw new ConflictError('New member number already exists.');
    }

    if (value.dateOfBirth) {
        value.ageCategory = calculateAgeCategory(value.dateOfBirth);
    }

    const oldMember = { ...existingMember };
    const updatedMember = await prisma.member.update({
        where: { id: memberId },
        data: value,
        include: { branch: { select: { name: true } } }
    });

    await logAudit(req.user.id, req.user.username, 'UPDATE', 'members', updatedMember.id, oldMember, updatedMember, req);

    res.status(200).json({
        message: 'Member updated successfully.',
        member: updatedMember
    });
}));

// Delete Member
app.delete('/api/members/:id', authenticateToken, checkPermission('members', 'delete'), asyncHandler(async (req, res) => {
    const memberId = parseInt(req.params.id, 10);
    if (isNaN(memberId)) throw new ValidationError('Invalid member ID.');

    const existingMember = await prisma.member.findUnique({
        where: { id: memberId },
        include: {
            _count: {
                select: {
                    contributions: true, generalTransactions: true,
                    memberProjects: true
                }
            }
        }
    });

    if (!existingMember) throw new NotFoundError('Member not found.');

    if (existingMember.branchCode !== req.user.branchCode && !req.user.role.permissions.members?.includes('delete_all')) {
        throw new ForbiddenError('You can only delete members in your own branch.');
    }

    const hasDependencies = existingMember._count.contributions > 0 || existingMember._count.generalTransactions > 0 || existingMember._count.memberProjects > 0;
    if (hasDependencies) {
        throw new ConflictError('Cannot delete member with associated contributions or transactions.');
    }

    await prisma.member.delete({ where: { id: memberId } });
    console.log(`deleted member ${memberId}`);

    await logAudit(req.user.id, req.user.username, 'DELETE', 'members', memberId, existingMember, null, req);

    res.status(200).json({ message: 'Member deleted successfully.' });
}));


// --- PROJECT MANAGEMENT ROUTES ---

// Create Project
app.post('/api/projects', authenticateToken, checkPermission('projects', 'create'), asyncHandler(async (req, res) => {
    const { error, value } = projectCreateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    // Verify branch and currency exist
    const [branchExists, currencyExists] = await Promise.all([
        prisma.branch.findUnique({ where: { code: value.branchCode } }),
        prisma.currency.findUnique({ where: { code: value.currencyCode } })
    ]);

    if (!branchExists) throw new NotFoundError('Branch not found.');
    if (!currencyExists) throw new NotFoundError('Currency not found.');

    const newProject = await prisma.project.create({
        data: value,
        include: {
            branch: { select: { name: true } },
            currency: { select: { name: true, symbol: true } }
        }
    });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'projects', newProject.id, null, newProject, req);

    res.status(201).json({
        message: 'Project created successfully.',
        project: newProject
    });
}));

// Get Projects
app.get('/api/projects', authenticateToken, checkPermission('projects', 'read'), asyncHandler(async (req, res) => {
    const { branchCode, isActive, status } = req.query;

    let whereClause = {};

    if (!req.user.role.permissions.projects?.includes('read_all')) {
        whereClause.branchCode = req.user.branchCode;
    } else if (branchCode) {
        whereClause.branchCode = branchCode;
    }

    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    if (status) whereClause.status = status;

    const projects = await prisma.project.findMany({
        where: whereClause,
        include: {
            branch: { select: { name: true } },
            currency: { select: { name: true, symbol: true } },
            _count: {
                select: { memberProjects: true, contributions: true }
            }
        },
        orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }]
    });

    // Calculate project statistics
    const projectsWithStats = await Promise.all(projects.map(async project => {
        const stats = await prisma.memberContribution.aggregate({
            where: {
                projectId: project.id,
                status: 'COMPLETED'
            },
            _sum: { amount: true }
        });

        const totalCollected = parseFloat(stats._sum.amount || 0);
        const targetAmount = parseFloat(project.targetAmount);

        return {
            ...project,
            memberCount: project._count.memberProjects,
            contributionCount: project._count.contributions,
            totalCollected,
            progressPercentage: targetAmount > 0 ? Math.min(100, (totalCollected / targetAmount) * 100) : 0
        };
    }));

    res.status(200).json(projectsWithStats);
}));

// Get Project by ID
app.get('/api/projects/:id', authenticateToken, checkPermission('projects', 'read'), asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) throw new ValidationError('Invalid project ID.');

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            branch: { select: { name: true } },
            currency: { select: { name: true, symbol: true } },
            _count: { select: { memberProjects: true, contributions: true, expenditures: true } }
        }
    });

    if (!project) throw new NotFoundError('Project not found.');
    if (project.branchCode !== req.user.branchCode && !req.user.role.permissions.projects?.includes('read_all')) {
        throw new ForbiddenError('You can only view projects in your own branch.');
    }

    const stats = await prisma.memberContribution.aggregate({
        where: { projectId: project.id, status: 'COMPLETED' },
        _sum: { amount: true }
    });
    const totalCollected = parseFloat(stats._sum.amount || 0);

    res.status(200).json({
        ...project,
        totalCollected,
        progressPercentage: project.targetAmount > 0 ? Math.min(100, (totalCollected / parseFloat(project.targetAmount)) * 100) : 0
    });
}));

// Update Project
app.patch('/api/projects/:id', authenticateToken, checkPermission('projects', 'update'), asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) throw new ValidationError('Invalid project ID.');

    const { error, value } = projectUpdateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const existingProject = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existingProject) throw new NotFoundError('Project not found.');

    if (existingProject.branchCode !== req.user.branchCode && !req.user.role.permissions.projects?.includes('update_all')) {
        throw new ForbiddenError('You can only update projects in your own branch.');
    }

    if (value.branchCode) {
        const branchExists = await prisma.branch.findUnique({ where: { code: value.branchCode } });
        if (!branchExists) throw new NotFoundError('New branch not found.');
    }
    if (value.currencyCode) {
        const currencyExists = await prisma.currency.findUnique({ where: { code: value.currencyCode } });
        if (!currencyExists) throw new NotFoundError('New currency not found.');
    }

    const oldProject = { ...existingProject };
    const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: value,
        include: { branch: { select: { name: true } } }
    });

    await logAudit(req.user.id, req.user.username, 'UPDATE', 'projects', updatedProject.id, oldProject, updatedProject, req);

    res.status(200).json({
        message: 'Project updated successfully.',
        project: updatedProject
    });
}));

// Delete Project
app.delete('/api/projects/:id', authenticateToken, checkPermission('projects', 'delete'), asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) throw new ValidationError('Invalid project ID.');

    const existingProject = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            _count: {
                select: {
                    contributions: true, memberProjects: true,
                    expenditures: true, contracts: true
                }
            }
        }
    });

    if (!existingProject) throw new NotFoundError('Project not found.');

    if (existingProject.branchCode !== req.user.branchCode && !req.user.role.permissions.projects?.includes('delete_all')) {
        throw new ForbiddenError('You can only delete projects in your own branch.');
    }

    const hasDependencies = existingProject._count.contributions > 0 || existingProject._count.memberProjects > 0 || existingProject._count.expenditures > 0 || existingProject._count.contracts > 0;
    if (hasDependencies) {
        throw new ConflictError('Cannot delete project with associated contributions, members, expenditures, or contracts.');
    }

    await prisma.project.delete({ where: { id: projectId } });

    await logAudit(req.user.id, req.user.username, 'DELETE', 'projects', projectId, existingProject, null, req);

    res.status(200).json({ message: 'Project deleted successfully.' });
}));


// Associate Member with Project
app.post('/api/members/:memberId/projects', authenticateToken, checkPermission('members', 'update'), asyncHandler(async (req, res) => {
    const memberId = parseInt(req.params.memberId, 10);
    const { error, value } = memberProjectSchema.validate({ ...req.body, memberId });
    if (error) throw new ValidationError(error.details[0].message);

    const { projectId, requiredAmount, currencyCode } = value;

    const [member, project] = await Promise.all([
        prisma.member.findUnique({ where: { id: memberId } }),
        prisma.project.findUnique({ where: { id: projectId } })
    ]);

    if (!member) throw new NotFoundError('Member not found.');
    if (!project) throw new NotFoundError('Project not found.');
    if (member.branchCode !== req.user.branchCode && !req.user.role.permissions.members?.includes('update_all')) {
        throw new ForbiddenError('You can only enroll members in your own branch.');
    }

    const existingEnrollment = await prisma.memberProject.findUnique({
        where: {
            memberId_projectId: { memberId, projectId }
        }
    });
    if (existingEnrollment) throw new ConflictError('Member is already associated with this project.');

    const newAssociation = await prisma.memberProject.create({
        data: {
            memberId,
            projectId,
            requiredAmount: requiredAmount || project.targetAmount,
            currencyCode: currencyCode || project.currencyCode
        }
    });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'member_projects', newAssociation.id, null, newAssociation, req);

    res.status(201).json({
        message: 'Member successfully enrolled in project.',
        association: newAssociation
    });
}));


// --- TRANSACTION ROUTES ---

// Record Member Contribution
app.post('/api/contributions', authenticateToken, checkPermission('transactions', 'create'), asyncHandler(async (req, res) => {
    const { error, value } = contributionCreateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const { memberId, projectId, amount, currencyCode, paymentMethodId, referenceNumber, notes, paymentDate } = value;

    // Verify member and project exist and are linked
    const memberProject = await prisma.memberProject.findUnique({
        where: {
            memberId_projectId: { memberId, projectId }
        },
        include: {
            member: { select: { memberNumber: true, firstName: true, lastName: true, branchCode: true } },
            project: { select: { name: true, branchCode: true, isActive: true } }
        }
    });

    if (!memberProject) {
        throw new NotFoundError('Member is not enrolled in this project.');
    }

    if (!memberProject.project.isActive) {
        throw new ValidationError('Cannot record contributions for inactive projects.');
    }

    // Verify currency and payment method exist
    const [currencyExists, paymentMethodExists] = await Promise.all([
        prisma.currency.findUnique({ where: { code: currencyCode } }),
        prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } })
    ]);

    if (!currencyExists) throw new NotFoundError('Currency not found.');
    if (!paymentMethodExists) throw new NotFoundError('Payment method not found.');

    const transaction = await prisma.$transaction(async (tx) => {
        const receiptNumber = await generateReceiptNumber('contribution', memberProject.project.branchCode, tx);

        return tx.memberContribution.create({
            data: {
                receiptNumber,
                memberId,
                projectId,
                amount: new Prisma.Decimal(amount),
                currencyCode,
                paymentMethodId,
                referenceNumber,
                paymentDate: new Date(paymentDate),
                processedBy: req.user.id,
                notes,
                status: 'COMPLETED'
            },
            include: {
                member: { select: { memberNumber: true, firstName: true, lastName: true } },
                project: { select: { name: true } },
                processor: { select: { username: true } },
                currency: { select: { code: true, symbol: true } },
                paymentMethod: { select: { name: true } }
            }
        });
    });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'member_contributions', transaction.receiptNumber, null, transaction, req);

    res.status(201).json({
        message: 'Contribution recorded successfully.',
        contribution: transaction
    });
}));

// Record General Transaction
app.post('/api/transactions', authenticateToken, checkPermission('transactions', 'create'), asyncHandler(async (req, res) => {
    const { error, value } = transactionCreateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const { memberId, revenueHeadCode, amount, currencyCode, paymentMethodId, referenceNumber, notes, transactionDate } = value;

    // Verify member, revenue head, currency, and payment method exist
    const [member, revenueHead, currency, paymentMethod] = await Promise.all([
        prisma.member.findUnique({
            where: { id: memberId },
            select: { id: true, memberNumber: true, firstName: true, lastName: true, branchCode: true }
        }),
        prisma.revenueHead.findUnique({ where: { code: revenueHeadCode } }),
        prisma.currency.findUnique({ where: { code: currencyCode } }),
        prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } })
    ]);

    if (!member) throw new NotFoundError('Member not found.');
    if (!revenueHead) throw new NotFoundError('Revenue head not found.');
    if (!currency) throw new NotFoundError('Currency not found.');
    if (!paymentMethod) throw new NotFoundError('Payment method not found.');

    const transaction = await prisma.$transaction(async (tx) => {
        const receiptNumber = await generateReceiptNumber('transaction', member.branchCode, tx);

        return tx.transaction.create({
            data: {
                receiptNumber,
                memberId,
                revenueHeadCode,
                amount: new Prisma.Decimal(amount),
                currencyCode,
                paymentMethodId,
                referenceNumber,
                branchCode: member.branchCode,
                transactionDate: new Date(transactionDate),
                userId: req.user.id,
                notes,
                status: 'completed'
            },
            include: {
                member: { select: { memberNumber: true, firstName: true, lastName: true } },
                revenueHead: { select: { name: true } },
                user: { select: { username: true } },
                currency: { select: { code: true, symbol: true } },
                paymentMethod: { select: { name: true } }
            }
        });
    });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'transactions', transaction.receiptNumber, null, transaction, req);

    res.status(201).json({
        message: 'Transaction recorded successfully.',
        transaction
    });
}));


//--Gettiing Transactions
app.get('/api/transactions', authenticateToken, checkPermission('transactions', 'read'), asyncHandler(async (req, res) => {
    // 1. Destructure and validate query parameters
    const { limit = 50, offset = 0, branchCode, approvalStatus, startDate, endDate } = req.query;

    const take = parseInt(limit, 10);
    const skip = parseInt(offset, 10);

    let whereClause = {};

    // 2. Implement row-level security and optional branch filtering
    if (!req.user.role.permissions.transactions?.includes('read_all')) {
        // If user does not have 'read_all' permission, they can only see their branch's transactions
        whereClause.branchCode = req.user.branchCode;
    } else if (branchCode) {
        // If user has 'read_all' permission and provides a branchCode, filter by it
        whereClause.branchCode = branchCode;
    }

    // 3. Add other filters if they exist
    // This is a transaction endpoint, approvalStatus is likely an expenditure field, remove it if not needed.
    // If your Transaction model has an approvalStatus field, keep this.
    if (approvalStatus) {
        whereClause.approvalStatus = approvalStatus;
    }

    // 4. Implement date filtering
    if (startDate || endDate) {
        whereClause.transactionDate = {};
        if (startDate) {
            whereClause.transactionDate.gte = new Date(startDate);
        }
        if (endDate) {
            // Include the entire end day by setting the time to the next day's start
            const endDateObj = new Date(endDate);
            whereClause.transactionDate.lt = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate() + 1);
        }
    }

    // 5. Correct the Prisma query to use the correct model and includes
    try {
        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where: whereClause,
                take,
                skip,
                orderBy: { transactionDate: 'desc' },
              
                include: {
                    revenueHead: { select: { name: true } },
                    member: { select: { firstName: true, lastName: true } },
                    currency: { select: { name: true, symbol: true } },
                    paymentMethod: { select: { name: true } },
                    branch: { select: { name: true } },
                   
                    user: { select: { username: true } } 
                }
            }),
            prisma.transaction.count({ where: whereClause })
        ]);

       
        res.status(200).json({
            total,
            limit: take,
            offset: skip,
            transactions 
        });

    } catch (error) {
       
        logger.error('Error fetching transactions:', error);
       
        throw new AppError('Failed to fetch transactions due to a database error.', 500);
    }
}));

// --- EXPENDITURE MANAGEMENT ROUTES ---

// Create Expenditure
app.post('/api/expenditures', authenticateToken, checkPermission('expenditures', 'create'), asyncHandler(async (req, res) => {
    const { error, value } = expenditureCreateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    // Calculate total amount
    value.totalAmount = parseFloat(value.amount) + parseFloat(value.taxAmount || 0);

    // Verify dependencies exist
    const [expenditureHead, currency, paymentMethod, branch] = await Promise.all([
        prisma.expenditureHead.findUnique({ where: { code: value.expenditureHeadCode } }),
        prisma.currency.findUnique({ where: { code: value.currencyCode } }),
        prisma.paymentMethod.findUnique({ where: { id: value.paymentMethodId } }),
        prisma.branch.findUnique({ where: { code: value.branchCode } })
    ]);

    if (!expenditureHead) throw new NotFoundError('Expenditure head not found.');
    if (!currency) throw new NotFoundError('Currency not found.');
    if (!paymentMethod) throw new NotFoundError('Payment method not found.');
    if (!branch) throw new NotFoundError('Branch not found.');

    // Verify optional dependencies
    if (value.projectId) {
        const projectExists = await prisma.project.findUnique({ where: { id: value.projectId } });
        if (!projectExists) throw new NotFoundError('Project not found.');
    }

    if (value.supplierId) {
        const supplierExists = await prisma.supplier.findUnique({ where: { id: value.supplierId } });
        if (!supplierExists) throw new NotFoundError('Supplier not found.');
    }

    if (value.reimbursedTo) {
        const memberExists = await prisma.member.findUnique({ where: { id: value.reimbursedTo } });
        if (!memberExists) throw new NotFoundError('Member for reimbursement not found.');
    }

    const expenditure = await prisma.$transaction(async (tx) => {
        const voucherNumber = await generateReceiptNumber('expenditure', value.branchCode, tx);

        return tx.expenditure.create({
            data: {
                ...value,
                voucherNumber,
                requestedBy: req.user.id,
                budgetYear: new Date().getFullYear(),
                amount: new Prisma.Decimal(value.amount),
                taxAmount: new Prisma.Decimal(value.taxAmount || 0),
                totalAmount: new Prisma.Decimal(value.totalAmount)
            },
            include: {
                expenditureHead: { select: { name: true } },
                project: { select: { name: true } },
                supplier: { select: { name: true } },
                currency: { select: { code: true, symbol: true } },
                paymentMethod: { select: { name: true } },
                requester: { select: { username: true } }
            }
        });
    });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'expenditures', expenditure.voucherNumber, null, expenditure, req);

    res.status(201).json({
        message: 'Expenditure created successfully.',
        expenditure
    });
}));

// Get Expenditures
app.get('/api/expenditures', authenticateToken, checkPermission('expenditures', 'read'), asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0, branchCode, approvalStatus, startDate, endDate } = req.query;

    const take = parseInt(limit, 10);
    const skip = parseInt(offset, 10);

    let whereClause = {};

    if (!req.user.role.permissions.expenditures?.includes('read_all')) {
        whereClause.branchCode = req.user.branchCode;
    } else if (branchCode) {
        whereClause.branchCode = branchCode;
    }

    if (approvalStatus) whereClause.approvalStatus = approvalStatus;

    if (startDate || endDate) {
        whereClause.expenseDate = {};
        if (startDate) whereClause.expenseDate.gte = new Date(startDate);
        if (endDate) whereClause.expenseDate.lt = new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1));
    }

    const [expenditures, total] = await Promise.all([
        prisma.expenditure.findMany({
            where: whereClause,
            take,
            skip,
            orderBy: { expenseDate: 'desc' },
            include: {
                expenditureHead: { select: { name: true } },
                project: { select: { name: true } },
                supplier: { select: { name: true } },
                currency: { select: { code: true, symbol: true } },
                paymentMethod: { select: { name: true } },
                requester: { select: { username: true } },
                approver: { select: { username: true } }
            }
        }),
        prisma.expenditure.count({ where: whereClause })
    ]);

    res.status(200).json({
        total,
        limit: take,
        offset: skip,
        expenditures
    });
}));

// Update Expenditure
app.patch('/api/expenditures/:id', authenticateToken, checkPermission('expenditures', 'update'), asyncHandler(async (req, res) => {
    const expenditureId = parseInt(req.params.id, 10);
    if (isNaN(expenditureId)) throw new ValidationError('Invalid expenditure ID.');

    const { error, value } = expenditureUpdateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const existingExpenditure = await prisma.expenditure.findUnique({ where: { id: expenditureId } });
    if (!existingExpenditure) throw new NotFoundError('Expenditure not found.');

    if (existingExpenditure.branchCode !== req.user.branchCode && !req.user.role.permissions.expenditures?.includes('update_all')) {
        throw new ForbiddenError('You can only update expenditures in your own branch.');
    }

    if (existingExpenditure.approvalStatus !== 'PENDING' && !req.user.role.permissions.expenditures?.includes('approve')) {
        throw new ForbiddenError('Only approvers can modify approved expenditures.');
    }

    if (value.amount || value.taxAmount) {
        value.totalAmount = (parseFloat(value.amount || existingExpenditure.amount) + parseFloat(value.taxAmount || existingExpenditure.taxAmount));
    }

    const oldExpenditure = { ...existingExpenditure };
    const updatedExpenditure = await prisma.expenditure.update({
        where: { id: expenditureId },
        data: value,
        include: { expenditureHead: true }
    });

    await logAudit(req.user.id, req.user.username, 'UPDATE', 'expenditures', updatedExpenditure.id, oldExpenditure, updatedExpenditure, req);

    res.status(200).json({ message: 'Expenditure updated successfully.', expenditure: updatedExpenditure });
}));

// Delete Expenditure
app.delete('/api/expenditures/:id', authenticateToken, checkPermission('expenditures', 'delete'), asyncHandler(async (req, res) => {
    const expenditureId = parseInt(req.params.id, 10);
    if (isNaN(expenditureId)) throw new ValidationError('Invalid expenditure ID.');

    const existingExpenditure = await prisma.expenditure.findUnique({
        where: { id: expenditureId },
        include: {
            _count: { select: { receipts: true, assetCreated: true } }
        }
    });

    if (!existingExpenditure) throw new NotFoundError('Expenditure not found.');

    if (existingExpenditure.branchCode !== req.user.branchCode && !req.user.role.permissions.expenditures?.includes('delete_all')) {
        throw new ForbiddenError('You can only delete expenditures in your own branch.');
    }

    if (existingExpenditure._count.receipts > 0 || existingExpenditure._count.assetCreated > 0) {
        throw new ConflictError('Cannot delete expenditure with associated receipts or assets.');
    }

    await prisma.expenditure.delete({ where: { id: expenditureId } });

    await logAudit(req.user.id, req.user.username, 'DELETE', 'expenditures', expenditureId, existingExpenditure, null, req);

    res.status(200).json({ message: 'Expenditure deleted successfully.' });
}));


// --- SUPPLIER MANAGEMENT ROUTES ---

// Create Supplier
app.post('/api/suppliers', authenticateToken, checkPermission('suppliers', 'create'), asyncHandler(async (req, res) => {
    const { error, value } = supplierCreateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const supplier = await prisma.$transaction(async (tx) => {
        const code = await generateUniqueCode(tx, 'supplier', 'SUP');

        return tx.supplier.create({
            data: {
                ...value,
                code,
                status: 'ACTIVE',
                rating: 5,
                riskLevel: 'LOW'
            }
        });
    });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'suppliers', supplier.id, null, supplier, req);

    res.status(201).json({
        message: 'Supplier created successfully.',
        supplier
    });
}));

// Get Suppliers
app.get('/api/suppliers', authenticateToken, checkPermission('suppliers', 'read'), asyncHandler(async (req, res) => {
    const { status, supplierType } = req.query;

    let whereClause = {};

    if (status) whereClause.status = status;
    if (supplierType) whereClause.supplierType = supplierType;

    const suppliers = await prisma.supplier.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { expenditures: true, contracts: true }
            }
        }
    });

    res.status(200).json(suppliers);
}));

// Update Supplier
app.patch('/api/suppliers/:id', authenticateToken, checkPermission('suppliers', 'update'), asyncHandler(async (req, res) => {
    const supplierId = parseInt(req.params.id, 10);
    if (isNaN(supplierId)) throw new ValidationError('Invalid supplier ID.');

    const { error, value } = supplierUpdateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const existingSupplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!existingSupplier) throw new NotFoundError('Supplier not found.');

    if (value.name && value.name !== existingSupplier.name) {
        const nameConflict = await prisma.supplier.findFirst({
            where: { name: value.name, NOT: { id: supplierId } }
        });
        if (nameConflict) throw new ConflictError('Supplier with this name already exists.');
    }

    const oldSupplier = { ...existingSupplier };
    const updatedSupplier = await prisma.supplier.update({
        where: { id: supplierId },
        data: value
    });

    await logAudit(req.user.id, req.user.username, 'UPDATE', 'suppliers', updatedSupplier.id, oldSupplier, updatedSupplier, req);

    res.status(200).json({ message: 'Supplier updated successfully.', supplier: updatedSupplier });
}));

// Delete Supplier
app.delete('/api/suppliers/:id', authenticateToken, checkPermission('suppliers', 'delete'), asyncHandler(async (req, res) => {
    const supplierId = parseInt(req.params.id, 10);
    if (isNaN(supplierId)) throw new ValidationError('Invalid supplier ID.');

    const existingSupplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
        include: {
            _count: {
                select: { expenditures: true, contracts: true, evaluations: true }
            }
        }
    });

    if (!existingSupplier) throw new NotFoundError('Supplier not found.');

    const hasDependencies = existingSupplier._count.expenditures > 0 || existingSupplier._count.contracts > 0 || existingSupplier._count.evaluations > 0;
    if (hasDependencies) {
        throw new ConflictError('Cannot delete supplier with associated expenditures, contracts, or evaluations.');
    }

    await prisma.supplier.delete({ where: { id: supplierId } });

    await logAudit(req.user.id, req.user.username, 'DELETE', 'suppliers', supplierId, existingSupplier, null, req);

    res.status(200).json({ message: 'Supplier deleted successfully.' });
}));


// --- ASSET MANAGEMENT ROUTES ---

// Create Asset
app.post('/api/assets', authenticateToken, checkPermission('assets', 'create'), asyncHandler(async (req, res) => {
    const { error, value } = assetCreateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    // Verify dependencies
    const [branchExists, currencyExists] = await Promise.all([
        prisma.branch.findUnique({ where: { code: value.branchCode } }),
        prisma.currency.findUnique({ where: { code: value.currencyCode } })
    ]);

    if (!branchExists) throw new NotFoundError('Branch not found.');
    if (!currencyExists) throw new NotFoundError('Currency not found.');

    if (value.expenditureId) {
        const expenditureExists = await prisma.expenditure.findUnique({ where: { id: value.expenditureId } });
        if (!expenditureExists) throw new NotFoundError('Expenditure not found.');
    }

    if (value.assignedTo) {
        const userExists = await prisma.user.findUnique({ where: { id: value.assignedTo } });
        if (!userExists) throw new NotFoundError('Assigned user not found.');
    }

    const asset = await prisma.$transaction(async (tx) => {
        const assetNumber = await generateUniqueCode(tx, 'asset', 'AST', 4);

        return tx.asset.create({
            data: {
                ...value,
                assetNumber,
                purchasePrice: new Prisma.Decimal(value.purchasePrice),
                currentValue: new Prisma.Decimal(value.purchasePrice),
                depreciationRate: value.depreciationRate ? new Prisma.Decimal(value.depreciationRate) : null
            },
            include: {
                branch: { select: { name: true } },
                currency: { select: { code: true, symbol: true } },
                assignee: { select: { username: true, firstName: true, lastName: true } }
            }
        });
    });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'assets', asset.id, null, asset, req);

    res.status(201).json({
        message: 'Asset created successfully.',
        asset
    });
}));

// Get Assets
app.get('/api/assets', authenticateToken, checkPermission('assets', 'read'), asyncHandler(async (req, res) => {
    const { branchCode, category, condition, isActive } = req.query;

    let whereClause = {};

    if (branchCode) whereClause.branchCode = branchCode;
    if (category) whereClause.category = category;
    if (condition) whereClause.condition = condition;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const assets = await prisma.asset.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        include: {
            branch: { select: { name: true } },
            currency: { select: { code: true, symbol: true } },
            assignee: { select: { username: true, firstName: true, lastName: true } }
        }
    });

    res.status(200).json(assets);
}));

// Update Asset
app.patch('/api/assets/:id', authenticateToken, checkPermission('assets', 'update'), asyncHandler(async (req, res) => {
    const assetId = parseInt(req.params.id, 10);
    if (isNaN(assetId)) throw new ValidationError('Invalid asset ID.');

    const { error, value } = assetUpdateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const existingAsset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!existingAsset) throw new NotFoundError('Asset not found.');

    if (value.expenditureId && value.expenditureId !== existingAsset.expenditureId) {
        const expenditureExists = await prisma.expenditure.findUnique({ where: { id: value.expenditureId } });
        if (!expenditureExists) throw new NotFoundError('New expenditure not found.');
    }

    if (value.assignedTo && value.assignedTo !== existingAsset.assignedTo) {
        const userExists = await prisma.user.findUnique({ where: { id: value.assignedTo } });
        if (!userExists) throw new NotFoundError('New assigned user not found.');
    }

    if (value.purchasePrice) {
        value.currentValue = value.purchasePrice;
    }

    const oldAsset = { ...existingAsset };
    const updatedAsset = await prisma.asset.update({
        where: { id: assetId },
        data: {
            ...value,
            purchasePrice: value.purchasePrice ? new Prisma.Decimal(value.purchasePrice) : undefined,
            currentValue: value.currentValue ? new Prisma.Decimal(value.currentValue) : undefined,
            depreciationRate: value.depreciationRate ? new Prisma.Decimal(value.depreciationRate) : undefined,
        },
        include: {
            branch: { select: { name: true } },
            currency: { select: { code: true, symbol: true } },
            assignee: { select: { username: true, firstName: true, lastName: true } }
        }
    });

    await logAudit(req.user.id, req.user.username, 'UPDATE', 'assets', updatedAsset.id, oldAsset, updatedAsset, req);

    res.status(200).json({ message: 'Asset updated successfully.', asset: updatedAsset });
}));

// Delete Asset
app.delete('/api/assets/:id', authenticateToken, checkPermission('assets', 'delete'), asyncHandler(async (req, res) => {
    const assetId = parseInt(req.params.id, 10);
    if (isNaN(assetId)) throw new ValidationError('Invalid asset ID.');

    const existingAsset = await prisma.asset.findUnique({
        where: { id: assetId },
        include: {
            _count: { select: { maintenanceRecords: true } }
        }
    });

    if (!existingAsset) throw new NotFoundError('Asset not found.');
    if (existingAsset._count.maintenanceRecords > 0) {
        throw new ConflictError('Cannot delete asset with associated maintenance records.');
    }

    await prisma.asset.delete({ where: { id: assetId } });

    await logAudit(req.user.id, req.user.username, 'DELETE', 'assets', assetId, existingAsset, null, req);

    res.status(200).json({ message: 'Asset deleted successfully.' });
}));


// --- CONTRACT MANAGEMENT ROUTES ---

// Create Contract
app.post('/api/contracts', authenticateToken, checkPermission('contracts', 'create'), asyncHandler(async (req, res) => {
    const { error, value } = contractCreateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    // Verify dependencies
    const [supplierExists, currencyExists] = await Promise.all([
        prisma.supplier.findUnique({ where: { id: value.supplierId } }),
        prisma.currency.findUnique({ where: { code: value.currencyCode } })
    ]);

    if (!supplierExists) throw new NotFoundError('Supplier not found.');
    if (!currencyExists) throw new NotFoundError('Currency not found.');

    if (value.projectId) {
        const projectExists = await prisma.project.findUnique({ where: { id: value.projectId } });
        if (!projectExists) throw new NotFoundError('Project not found.');
    }

    const contract = await prisma.$transaction(async (tx) => {
        const contractNumber = await generateUniqueCode(tx, 'contract', 'CON');

        return tx.contract.create({
            data: {
                ...value,
                contractNumber,
                contractValue: new Prisma.Decimal(value.contractValue),
                status: 'DRAFT'
            },
            include: {
                supplier: { select: { name: true } },
                project: { select: { name: true } },
                currency: { select: { code: true, symbol: true } }
            }
        });
    });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'contracts', contract.id, null, contract, req);

    res.status(201).json({
        message: 'Contract created successfully.',
        contract
    });
}));

// Get Contracts
app.get('/api/contracts', authenticateToken, checkPermission('contracts', 'read'), asyncHandler(async (req, res) => {
    const { status, contractType, supplierId } = req.query;

    let whereClause = {};

    if (status) whereClause.status = status;
    if (contractType) whereClause.contractType = contractType;
    if (supplierId) whereClause.supplierId = parseInt(supplierId, 10);

    const contracts = await prisma.contract.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
            supplier: { select: { name: true } },
            project: { select: { name: true } },
            currency: { select: { code: true, symbol: true } },
            signer: { select: { username: true } }
        }
    });

    res.status(200).json(contracts);
}));

// Update Contract
app.patch('/api/contracts/:id', authenticateToken, checkPermission('contracts', 'update'), asyncHandler(async (req, res) => {
    const contractId = parseInt(req.params.id, 10);
    if (isNaN(contractId)) throw new ValidationError('Invalid contract ID.');

    const { error, value } = contractUpdateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const existingContract = await prisma.contract.findUnique({ where: { id: contractId } });
    if (!existingContract) throw new NotFoundError('Contract not found.');

    if (value.supplierId && value.supplierId !== existingContract.supplierId) {
        const supplierExists = await prisma.supplier.findUnique({ where: { id: value.supplierId } });
        if (!supplierExists) throw new NotFoundError('New supplier not found.');
    }

    if (value.projectId && value.projectId !== existingContract.projectId) {
        const projectExists = await prisma.project.findUnique({ where: { id: value.projectId } });
        if (!projectExists) throw new NotFoundError('New project not found.');
    }

    const oldContract = { ...existingContract };
    const updatedContract = await prisma.contract.update({
        where: { id: contractId },
        data: {
            ...value,
            contractValue: value.contractValue ? new Prisma.Decimal(value.contractValue) : undefined
        },
        include: { supplier: { select: { name: true } } }
    });

    await logAudit(req.user.id, req.user.username, 'UPDATE', 'contracts', updatedContract.id, oldContract, updatedContract, req);

    res.status(200).json({ message: 'Contract updated successfully.', contract: updatedContract });
}));

// Delete Contract
app.delete('/api/contracts/:id', authenticateToken, checkPermission('contracts', 'delete'), asyncHandler(async (req, res) => {
    const contractId = parseInt(req.params.id, 10);
    if (isNaN(contractId)) throw new ValidationError('Invalid contract ID.');

    const existingContract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: { _count: { select: { milestones: true } } }
    });

    if (!existingContract) throw new NotFoundError('Contract not found.');
    if (existingContract._count.milestones > 0) {
        throw new ConflictError('Cannot delete contract with associated milestones.');
    }

    await prisma.contract.delete({ where: { id: contractId } });

    await logAudit(req.user.id, req.user.username, 'DELETE', 'contracts', contractId, existingContract, null, req);

    res.status(200).json({ message: 'Contract deleted successfully.' });
}));


// --- BUDGET MANAGEMENT ROUTES ---

// Create Budget Period
app.post('/api/budget-periods', authenticateToken, checkPermission('budgets', 'create'), asyncHandler(async (req, res) => {
    const { error, value } = budgetPeriodCreateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const currencyExists = await prisma.currency.findUnique({ where: { code: value.currencyCode } });
    if (!currencyExists) throw new NotFoundError('Currency not found.');

    const budgetPeriod = await prisma.budgetPeriod.create({
        data: {
            ...value,
            totalBudget: new Prisma.Decimal(value.totalBudget),
            status: 'DRAFT'
        },
        include: {
            currency: { select: { code: true, symbol: true } }
        }
    });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'budget_periods', budgetPeriod.id, null, budgetPeriod, req);

    res.status(201).json({
        message: 'Budget period created successfully.',
        budgetPeriod
    });
}));

// Get Budget Periods
app.get('/api/budget-periods', authenticateToken, checkPermission('budgets', 'read'), asyncHandler(async (req, res) => {
    const { budgetType, status } = req.query;

    let whereClause = {};

    if (budgetType) whereClause.budgetType = budgetType;
    if (status) whereClause.status = status;

    const budgetPeriods = await prisma.budgetPeriod.findMany({
        where: whereClause,
        orderBy: { startDate: 'desc' },
        include: {
            currency: { select: { code: true, symbol: true } },
            _count: { select: { budgetLines: true } }
        }
    });

    res.status(200).json(budgetPeriods);
}));

// Update Budget Period
app.patch('/api/budget-periods/:id', authenticateToken, checkPermission('budgets', 'update'), asyncHandler(async (req, res) => {
    const budgetPeriodId = parseInt(req.params.id, 10);
    if (isNaN(budgetPeriodId)) throw new ValidationError('Invalid budget period ID.');

    const { error, value } = budgetPeriodUpdateSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const existingPeriod = await prisma.budgetPeriod.findUnique({ where: { id: budgetPeriodId } });
    if (!existingPeriod) throw new NotFoundError('Budget period not found.');

    if (value.currencyCode && value.currencyCode !== existingPeriod.currencyCode) {
        const currencyExists = await prisma.currency.findUnique({ where: { code: value.currencyCode } });
        if (!currencyExists) throw new NotFoundError('New currency not found.');
    }

    const oldPeriod = { ...existingPeriod };
    const updatedPeriod = await prisma.budgetPeriod.update({
        where: { id: budgetPeriodId },
        data: {
            ...value,
            totalBudget: value.totalBudget ? new Prisma.Decimal(value.totalBudget) : undefined,
            actualSpent: value.actualSpent ? new Prisma.Decimal(value.actualSpent) : undefined
        },
        include: { currency: true }
    });

    await logAudit(req.user.id, req.user.username, 'UPDATE', 'budget_periods', updatedPeriod.id, oldPeriod, updatedPeriod, req);

    res.status(200).json({ message: 'Budget period updated successfully.', budgetPeriod: updatedPeriod });
}));

// Delete Budget Period
app.delete('/api/budget-periods/:id', authenticateToken, checkPermission('budgets', 'delete'), asyncHandler(async (req, res) => {
    const budgetPeriodId = parseInt(req.params.id, 10);
    if (isNaN(budgetPeriodId)) throw new ValidationError('Invalid budget period ID.');

    const existingPeriod = await prisma.budgetPeriod.findUnique({
        where: { id: budgetPeriodId },
        include: { _count: { select: { budgetLines: true } } }
    });

    if (!existingPeriod) throw new NotFoundError('Budget period not found.');
    if (existingPeriod._count.budgetLines > 0) {
        throw new ConflictError('Cannot delete budget period with associated budget lines.');
    }

    await prisma.budgetPeriod.delete({ where: { id: budgetPeriodId } });

    await logAudit(req.user.id, req.user.username, 'DELETE', 'budget_periods', budgetPeriodId, existingPeriod, null, req);

    res.status(200).json({ message: 'Budget period deleted successfully.' });
}));


// Create/Update Budget Line
app.post('/api/budget-periods/:budgetPeriodId/lines', authenticateToken, checkPermission('budgets', 'create'), asyncHandler(async (req, res) => {
    const budgetPeriodId = parseInt(req.params.budgetPeriodId, 10);
    const { error, value } = budgetLineSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const { expenditureHeadCode, projectId, budgetedAmount } = value;

    const [budgetPeriod, expenditureHead] = await Promise.all([
        prisma.budgetPeriod.findUnique({ where: { id: budgetPeriodId } }),
        prisma.expenditureHead.findUnique({ where: { code: expenditureHeadCode } })
    ]);

    if (!budgetPeriod) throw new NotFoundError('Budget period not found.');
    if (!expenditureHead) throw new NotFoundError('Expenditure head not found.');
    if (projectId) {
        const projectExists = await prisma.project.findUnique({ where: { id: projectId } });
        if (!projectExists) throw new NotFoundError('Project not found.');
    }

    const budgetLine = await prisma.budgetLine.upsert({
        where: {
            budgetPeriodId_expenditureHeadCode_projectId: {
                budgetPeriodId,
                expenditureHeadCode,
                projectId: projectId || 0
            }
        },
        update: {
            budgetedAmount: new Prisma.Decimal(budgetedAmount),
            notes: value.notes
        },
        create: {
            budgetPeriodId,
            expenditureHeadCode,
            projectId,
            budgetedAmount: new Prisma.Decimal(budgetedAmount),
            notes: value.notes
        }
    });

    await logAudit(req.user.id, req.user.username, 'UPSERT', 'budget_lines', budgetLine.id, null, budgetLine, req);

    res.status(201).json({ message: 'Budget line saved successfully.', budgetLine });
}));


// --- CURRENCY AND PAYMENT METHOD ROUTES ---

// Create Currency
app.post('/api/currencies', authenticateToken, checkPermission('currencies', 'manage'), asyncHandler(async (req, res) => {
    const { error, value } = currencySchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const existingCurrency = await prisma.currency.findUnique({ where: { code: value.code } });
    if (existingCurrency) throw new ConflictError('Currency with this code already exists.');

    const newCurrency = await prisma.currency.create({ data: value });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'currencies', newCurrency.code, null, newCurrency, req);

    res.status(201).json(newCurrency);
}));

// Get Currencies
app.get('/api/currencies', authenticateToken, checkPermission('currencies', 'read'), asyncHandler(async (req, res) => {
    const currencies = await prisma.currency.findMany({
        orderBy: { code: 'asc' },
        include: {
            _count: { select: { allowedPaymentMethods: true } }
        }
    });

    res.status(200).json(currencies);
}));

// Update Currency
app.patch('/api/currencies/:code', authenticateToken, checkPermission('currencies', 'manage'), asyncHandler(async (req, res) => {
    const { code } = req.params;
    const { error, value } = currencySchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const existingCurrency = await prisma.currency.findUnique({ where: { code } });
    if (!existingCurrency) throw new NotFoundError('Currency not found.');

    const oldCurrency = { ...existingCurrency };
    const updatedCurrency = await prisma.currency.update({
        where: { code },
        data: value
    });

    await logAudit(req.user.id, req.user.username, 'UPDATE', 'currencies', updatedCurrency.code, oldCurrency, updatedCurrency, req);

    res.status(200).json(updatedCurrency);
}));

// Delete Currency
app.delete('/api/currencies/:code', authenticateToken, checkPermission('currencies', 'manage'), asyncHandler(async (req, res) => {
    const { code } = req.params;

    const existingCurrency = await prisma.currency.findUnique({
        where: { code },
        include: {
            _count: {
                select: {
                    transactions: true, refunds: true, projects: true,
                    memberContributions: true, expenditures: true,
                    contracts: true, assets: true, budgetPeriods: true
                }
            }
        }
    });

    if (!existingCurrency) throw new NotFoundError('Currency not found.');
    const hasDependencies = Object.values(existingCurrency._count).some(count => count > 0);
    if (hasDependencies) {
        throw new ConflictError('Cannot delete currency with associated records (transactions, projects, etc.).');
    }

    await prisma.currency.delete({ where: { code } });

    await logAudit(req.user.id, req.user.username, 'DELETE', 'currencies', code, existingCurrency, null, req);

    res.status(200).json({ message: 'Currency deleted successfully.' });
}));


// Create Payment Method
app.post('/api/payment-methods', authenticateToken, checkPermission('payment_methods', 'manage'), asyncHandler(async (req, res) => {
    const { error, value } = paymentMethodSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const existingMethod = await prisma.paymentMethod.findFirst({ where: { name: value.name } });
    if (existingMethod) throw new ConflictError('Payment method with this name already exists.');

    const newMethod = await prisma.paymentMethod.create({ data: value });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'payment_methods', newMethod.id, null, newMethod, req);

    res.status(201).json(newMethod);
}));

// Get Payment Methods
app.get('/api/payment-methods', authenticateToken, checkPermission('payment_methods', 'read'), asyncHandler(async (req, res) => {
    const paymentMethods = await prisma.paymentMethod.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: { select: { allowedCurrencies: true } }
        }
    });

    res.status(200).json(paymentMethods);
}));

// Update Payment Method
app.patch('/api/payment-methods/:id', authenticateToken, checkPermission('payment_methods', 'manage'), asyncHandler(async (req, res) => {
    const paymentMethodId = parseInt(req.params.id, 10);
    if (isNaN(paymentMethodId)) throw new ValidationError('Invalid payment method ID.');

    const { error, value } = paymentMethodSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const existingMethod = await prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
    if (!existingMethod) throw new NotFoundError('Payment method not found.');

    const oldMethod = { ...existingMethod };
    const updatedMethod = await prisma.paymentMethod.update({
        where: { id: paymentMethodId },
        data: value
    });

    await logAudit(req.user.id, req.user.username, 'UPDATE', 'payment_methods', updatedMethod.id, oldMethod, updatedMethod, req);

    res.status(200).json(updatedMethod);
}));

// Delete Payment Method
app.delete('/api/payment-methods/:id', authenticateToken, checkPermission('payment_methods', 'manage'), asyncHandler(async (req, res) => {
    const paymentMethodId = parseInt(req.params.id, 10);
    if (isNaN(paymentMethodId)) throw new ValidationError('Invalid payment method ID.');

    const existingMethod = await prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId },
        include: {
            _count: { select: { transactions: true, memberContributions: true, expenditures: true } }
        }
    });

    if (!existingMethod) throw new NotFoundError('Payment method not found.');
    const hasDependencies = Object.values(existingMethod._count).some(count => count > 0);
    if (hasDependencies) {
        throw new ConflictError('Cannot delete payment method with associated transactions or expenditures.');
    }

    await prisma.paymentMethod.delete({ where: { id: paymentMethodId } });

    await logAudit(req.user.id, req.user.username, 'DELETE', 'payment_methods', paymentMethodId, existingMethod, null, req);

    res.status(200).json({ message: 'Payment method deleted successfully.' });
}));


// --- REVENUE HEAD ROUTES ---

// Create Revenue Head
app.post('/api/revenue-heads', authenticateToken, checkPermission('revenue_heads', 'create'), asyncHandler(async (req, res) => {
    const { error, value } = revenueHeadSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const { name, branchCode } = value;

    const existingHead = await prisma.revenueHead.findFirst({
        where: { name, branchCode },
    });
    if (existingHead) throw new ConflictError('Revenue head with this name already exists for this branch.');

    const branchExists = await prisma.branch.findUnique({ where: { code: branchCode } });
    if (!branchExists) throw new NotFoundError('Branch not found.');

    const count = await prisma.revenueHead.count({ where: { branchCode } });
    const code = `${branchCode}R${String(count + 1).padStart(3, '0')}`;

    const newHead = await prisma.revenueHead.create({
        data: { ...value, code }
    });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'revenue_heads', newHead.code, null, newHead, req);

    res.status(201).json(newHead);
}));

// Get Revenue Heads
app.get('/api/revenue-heads', authenticateToken, checkPermission('revenue_heads', 'read'), asyncHandler(async (req, res) => {
    const { branchCode } = req.query;

    let whereClause = {};
    if (branchCode) whereClause.branchCode = branchCode;

    const heads = await prisma.revenueHead.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        include: {
            branch: { select: { name: true } },
            _count: { select: { transactions: true } }
        }
    });

    res.status(200).json(heads);
}));

// Update Revenue Head
app.patch('/api/revenue-heads/:code', authenticateToken, checkPermission('revenue_heads', 'update'), asyncHandler(async (req, res) => {
    const { code } = req.params;
    const { error, value } = revenueHeadSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const existingHead = await prisma.revenueHead.findUnique({ where: { code } });
    if (!existingHead) throw new NotFoundError('Revenue head not found.');

    if (value.name && value.name !== existingHead.name) {
        const nameConflict = await prisma.revenueHead.findFirst({
            where: { name: value.name, branchCode: existingHead.branchCode, NOT: { code } }
        });
        if (nameConflict) throw new ConflictError('Revenue head with this name already exists for this branch.');
    }
    if (value.branchCode && value.branchCode !== existingHead.branchCode) {
        const branchExists = await prisma.branch.findUnique({ where: { code: value.branchCode } });
        if (!branchExists) throw new NotFoundError('New branch not found.');
    }

    const oldHead = { ...existingHead };
    const updatedHead = await prisma.revenueHead.update({
        where: { code },
        data: value
    });

    await logAudit(req.user.id, req.user.username, 'UPDATE', 'revenue_heads', updatedHead.code, oldHead, updatedHead, req);

    res.status(200).json(updatedHead);
}));

// Delete Revenue Head
app.delete('/api/revenue-heads/:code', authenticateToken, checkPermission('revenue_heads', 'delete'), asyncHandler(async (req, res) => {
    const { code } = req.params;

    const existingHead = await prisma.revenueHead.findUnique({
        where: { code },
        include: { _count: { select: { transactions: true, contributionPlans: true } } }
    });

    if (!existingHead) throw new NotFoundError('Revenue head not found.');
    const hasDependencies = existingHead._count.transactions > 0 || existingHead._count.contributionPlans > 0;
    if (hasDependencies) {
        throw new ConflictError('Cannot delete revenue head with associated transactions or plans.');
    }

    await prisma.revenueHead.delete({ where: { code } });

    await logAudit(req.user.id, req.user.username, 'DELETE', 'revenue_heads', code, existingHead, null, req);

    res.status(200).json({ message: 'Revenue head deleted successfully.' });
}));


// --- EXPENDITURE HEAD ROUTES ---

// Create Expenditure Head
app.post('/api/expenditure-heads', authenticateToken, checkPermission('expenditure_heads', 'create'), asyncHandler(async (req, res) => {
    const { error, value } = expenditureHeadSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const { name, branchCode } = value;

    const existingHead = await prisma.expenditureHead.findFirst({
        where: { name, branchCode },
    });
    if (existingHead) throw new ConflictError('Expenditure head with this name already exists for this branch.');

    const branchExists = await prisma.branch.findUnique({ where: { code: branchCode } });
    if (!branchExists) throw new NotFoundError('Branch not found.');

    const count = await prisma.expenditureHead.count({ where: { branchCode } });
    const code = `${branchCode}E${String(count + 1).padStart(3, '0')}`;

    const newHead = await prisma.expenditureHead.create({
        data: { ...value, code }
    });

    await logAudit(req.user.id, req.user.username, 'CREATE', 'expenditure_heads', newHead.code, null, newHead, req);

    res.status(201).json(newHead);
}));

// Get Expenditure Heads
app.get('/api/expenditure-heads', authenticateToken, checkPermission('expenditure_heads', 'read'), asyncHandler(async (req, res) => {
    const { branchCode, category } = req.query;

    let whereClause = {};
    if (branchCode) whereClause.branchCode = branchCode;
    if (category) whereClause.category = category;

    const heads = await prisma.expenditureHead.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        include: {
            branch: { select: { name: true } },
            _count: { select: { expenditures: true } }
        }
    });

    res.status(200).json(heads);
}));

// Update Expenditure Head
app.patch('/api/expenditure-heads/:code', authenticateToken, checkPermission('expenditure_heads', 'update'), asyncHandler(async (req, res) => {
    const { code } = req.params;
    const { error, value } = expenditureHeadSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const existingHead = await prisma.expenditureHead.findUnique({ where: { code } });
    if (!existingHead) throw new NotFoundError('Expenditure head not found.');

    if (value.name && value.name !== existingHead.name) {
        const nameConflict = await prisma.expenditureHead.findFirst({
            where: { name: value.name, branchCode: existingHead.branchCode, NOT: { code } }
        });
        if (nameConflict) throw new ConflictError('Expenditure head with this name already exists for this branch.');
    }
    if (value.branchCode && value.branchCode !== existingHead.branchCode) {
        const branchExists = await prisma.branch.findUnique({ where: { code: value.branchCode } });
        if (!branchExists) throw new NotFoundError('New branch not found.');
    }

    const oldHead = { ...existingHead };
    const updatedHead = await prisma.expenditureHead.update({
        where: { code },
        data: { ...value, budgetLimit: value.budgetLimit ? new Prisma.Decimal(value.budgetLimit) : undefined }
    });

    await logAudit(req.user.id, req.user.username, 'UPDATE', 'expenditure_heads', updatedHead.code, oldHead, updatedHead, req);

    res.status(200).json(updatedHead);
}));

// Delete Expenditure Head
app.delete('/api/expenditure-heads/:code', authenticateToken, checkPermission('expenditure_heads', 'delete'), asyncHandler(async (req, res) => {
    const { code } = req.params;

    const existingHead = await prisma.expenditureHead.findUnique({
        where: { code },
        include: { _count: { select: { expenditures: true, budgetLines: true } } }
    });

    if (!existingHead) throw new NotFoundError('Expenditure head not found.');
    const hasDependencies = existingHead._count.expenditures > 0 || existingHead._count.budgetLines > 0;
    if (hasDependencies) {
        throw new ConflictError('Cannot delete expenditure head with associated expenditures or budget lines.');
    }

    await prisma.expenditureHead.delete({ where: { code } });

    await logAudit(req.user.id, req.user.username, 'DELETE', 'expenditure_heads', code, existingHead, null, req);

    res.status(200).json({ message: 'Expenditure head deleted successfully.' });
}));


// --- REPORTING AND DASHBOARD ROUTES ---

// Dashboard Statistics
app.get('/api/dashboard/stats', authenticateToken, asyncHandler(async (req, res) => {
    const { branchCode } = req.query;

    let branchFilter = {};

    if (!req.user.role.permissions.reports?.includes('read_all')) {
        branchFilter.branchCode = req.user.branchCode;
    } else if (branchCode) {
        branchFilter.branchCode = branchCode;
    }

    // Get basic counts
    const [
        totalMembers,
        totalProjects,
        activeProjects,
        totalContributions,
        totalTransactions,
        totalExpenditures,
        pendingApprovals
    ] = await Promise.all([
        prisma.member.count({ where: branchFilter }),
        prisma.project.count({ where: branchFilter }),
        prisma.project.count({ where: { ...branchFilter, isActive: true } }),
        prisma.memberContribution.count({
            where: {
                status: 'COMPLETED',
                project: { branchCode: branchFilter.branchCode }
            }
        }),
        prisma.transaction.count({
            where: {
                status: 'completed',
                ...branchFilter
            }
        }),
        prisma.expenditure.count({ where: branchFilter }),
        prisma.expenditure.count({
            where: {
                ...branchFilter,
                approvalStatus: 'PENDING'
            }
        })
    ]);

    // Get total amounts
    const [contributionTotal, transactionTotal, expenditureTotal] = await Promise.all([
        prisma.memberContribution.aggregate({
            where: {
                status: 'COMPLETED',
                project: { branchCode: branchFilter.branchCode }
            },
            _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
            where: {
                status: 'completed',
                ...branchFilter
            },
            _sum: { amount: true }
        }),
        prisma.expenditure.aggregate({
            where: {
                approvalStatus: 'APPROVED',
                ...branchFilter
            },
            _sum: { totalAmount: true }
        })
    ]);

    // This month's statistics
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const [thisMonthContributions, thisMonthTransactions, thisMonthExpenditures] = await Promise.all([
        prisma.memberContribution.aggregate({
            where: {
                status: 'COMPLETED',
                project: { branchCode: branchFilter.branchCode },
                paymentDate: { gte: thisMonth }
            },
            _sum: { amount: true },
            _count: true
        }),
        prisma.transaction.aggregate({
            where: {
                status: 'completed',
                ...branchFilter,
                transactionDate: { gte: thisMonth }
            },
            _sum: { amount: true },
            _count: true
        }),
        prisma.expenditure.aggregate({
            where: {
                ...branchFilter,
                expenseDate: { gte: thisMonth }
            },
            _sum: { totalAmount: true },
            _count: true
        })
    ]);

    res.status(200).json({
        totalMembers,
        totalProjects,
        activeProjects,
        totalContributions,
        totalTransactions,
        totalExpenditures,
        pendingApprovals,
        totalCollected: {
            contributions: parseFloat(contributionTotal._sum.amount || 0),
            transactions: parseFloat(transactionTotal._sum.amount || 0),
            total: parseFloat(contributionTotal._sum.amount || 0) + parseFloat(transactionTotal._sum.amount || 0)
        },
        totalSpent: parseFloat(expenditureTotal._sum.totalAmount || 0),
        thisMonth: {
            contributions: {
                count: thisMonthContributions._count || 0,
                amount: parseFloat(thisMonthContributions._sum.amount || 0)
            },
            transactions: {
                count: thisMonthTransactions._count || 0,
                amount: parseFloat(thisMonthTransactions._sum.amount || 0)
            },
            expenditures: {
                count: thisMonthExpenditures._count || 0,
                amount: parseFloat(thisMonthExpenditures._sum.totalAmount || 0)
            }
        }
    });
}));

// Export Transactions
app.get('/api/reports/transactions-export', authenticateToken, checkPermission('reports', 'export'), asyncHandler(async (req, res) => {
    const { branchCode, startDate, endDate, type = 'all', format = 'excel' } = req.query;

    let contributionWhere = {};
    let transactionWhere = {};
    let expenditureWhere = {};

    // Branch restriction
    if (!req.user.role.permissions.reports?.includes('export_all')) {
        contributionWhere.project = { branchCode: req.user.branchCode };
        transactionWhere.branchCode = req.user.branchCode;
        expenditureWhere.branchCode = req.user.branchCode;
    } else if (branchCode) {
        contributionWhere.project = { branchCode };
        transactionWhere.branchCode = branchCode;
        expenditureWhere.branchCode = branchCode;
    }

    // Date filters
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lt = new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1));

    if (Object.keys(dateFilter).length > 0) {
        contributionWhere.paymentDate = dateFilter;
        transactionWhere.transactionDate = dateFilter;
        expenditureWhere.expenseDate = dateFilter;
    }

    const allData = [];

    // Get contributions
    if (type === 'all' || type === 'contribution') {
        const contributions = await prisma.memberContribution.findMany({
            where: contributionWhere,
            include: {
                member: true,
                project: { select: { name: true, branchCode: true } },
                processor: { select: { username: true } },
                currency: { select: { code: true, symbol: true } },
                paymentMethod: { select: { name: true } }
            },
            orderBy: { paymentDate: 'desc' }
        });

        allData.push(...contributions.map(c => ({
            receiptNumber: c.receiptNumber,
            date: c.paymentDate.toLocaleDateString(),
            type: 'Contribution',
            memberNumber: c.member.memberNumber,
            memberName: `${c.member.firstName} ${c.member.lastName}`,
            description: c.project.name,
            amount: parseFloat(c.amount),
            currency: c.currencyCode,
            paymentMethod: c.paymentMethod.name,
            reference: c.referenceNumber || '',
            processedBy: c.processor.username,
            status: c.status,
            branch: c.project.branchCode,
            notes: c.notes || ''
        })));
    }

    // Get general transactions
    if (type === 'all' || type === 'transaction') {
        const transactions = await prisma.transaction.findMany({
            where: transactionWhere,
            include: {
                member: true,
                revenueHead: { select: { name: true } },
                user: { select: { username: true } },
                currency: { select: { code: true, symbol: true } },
                paymentMethod: { select: { name: true } }
            },
            orderBy: { transactionDate: 'desc' }
        });

        allData.push(...transactions.map(t => ({
            receiptNumber: t.receiptNumber,
            date: t.transactionDate.toLocaleDateString(),
            type: 'Transaction',
            memberNumber: t.member.memberNumber,
            memberName: `${t.member.firstName} ${t.member.lastName}`,
            description: t.revenueHead.name,
            amount: parseFloat(t.amount),
            currency: t.currencyCode,
            paymentMethod: t.paymentMethod.name,
            reference: t.referenceNumber || '',
            processedBy: t.user.username,
            status: t.status,
            branch: t.branchCode,
            notes: t.notes || ''
        })));
    }

    // Get expenditures
    if (type === 'all' || type === 'expenditure') {
        const expenditures = await prisma.expenditure.findMany({
            where: expenditureWhere,
            include: {
                expenditureHead: { select: { name: true } },
                supplier: { select: { name: true } },
                currency: { select: { code: true, symbol: true } },
                paymentMethod: { select: { name: true } },
                requester: { select: { username: true } }
            },
            orderBy: { expenseDate: 'desc' }
        });

        allData.push(...expenditures.map(e => ({
            receiptNumber: e.voucherNumber,
            date: e.expenseDate.toLocaleDateString(),
            type: 'Expenditure',
            memberNumber: '',
            memberName: e.supplier?.name || '',
            description: e.description,
            amount: parseFloat(e.totalAmount),
            currency: e.currencyCode,
            paymentMethod: e.paymentMethod.name,
            reference: e.referenceNumber || '',
            processedBy: e.requester.username,
            status: e.approvalStatus,
            branch: e.branchCode,
            notes: e.notes || ''
        })));
    }

    // Sort by date
    allData.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Financial Report');

        worksheet.columns = [
            { header: 'Receipt Number', key: 'receiptNumber', width: 20 },
            { header: 'Date', key: 'date', width: 12 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Member/Supplier', key: 'memberName', width: 25 },
            { header: 'Description', key: 'description', width: 30 },
            { header: 'Amount', key: 'amount', width: 12 },
            { header: 'Currency', key: 'currency', width: 10 },
            { header: 'Payment Method', key: 'paymentMethod', width: 15 },
            { header: 'Reference', key: 'reference', width: 15 },
            { header: 'Processed By', key: 'processedBy', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Branch', key: 'branch', width: 10 },
            { header: 'Notes', key: 'notes', width: 30 }
        ];

        allData.forEach(row => worksheet.addRow(row));

        // Style the header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="financial-report-${new Date().toISOString().split('T')[0]}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
    } else {
        // CSV format
        const headers = [
            'Receipt Number', 'Date', 'Type', 'Member/Supplier', 'Description',
            'Amount', 'Currency', 'Payment Method', 'Reference', 'Processed By',
            'Status', 'Branch', 'Notes'
        ];

        const csv = [headers.join(',')];

        allData.forEach(row => {
            csv.push([
                row.receiptNumber,
                row.date,
                row.type,
                `"${row.memberName}"`,
                `"${row.description}"`,
                row.amount,
                row.currency,
                row.paymentMethod,
                row.reference,
                row.processedBy,
                row.status,
                row.branch,
                `"${row.notes}"`
            ].join(','));
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="financial-report-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv.join('\n'));
    }
}));

// --- PASSWORD RESET ROUTES ---

app.post('/api/password-reset/request', asyncHandler(async (req, res) => {
    const { error, value } = passwordResetRequestSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const { username } = value;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
        logger.info(`Password reset requested for non-existent user: ${username}`);
        return res.status(200).json({ message: 'If a matching account is found, a password reset link will be sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    await prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
        await tx.passwordResetToken.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        });
    });

    logger.info(`Password reset token generated for user: ${username}. Token: ${token.substring(0, 5)}...`);
    // TODO: Implement email sending logic here
    res.status(200).json({ message: 'If a matching account is found, a password reset link will be sent.' });
}));

app.post('/api/password-reset/reset', asyncHandler(async (req, res) => {
    const { error, value } = passwordResetSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const { token, newPassword } = value;

    const resetEntry = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true }
    });

    if (!resetEntry || new Date() > resetEntry.expiresAt) {
        throw new AuthError('Password reset token is invalid or has expired.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: resetEntry.userId },
            data: { password_hash: hashedPassword, locked: false, attempts: 0 },
        });
        await tx.passwordResetToken.delete({ where: { id: resetEntry.id } });
    });

    logger.info(`Password successfully reset for user: ${resetEntry.user.username}`);
    res.status(200).json({ message: 'Password has been reset successfully.' });
}));

// --- QZ TRAY ENDPOINTS ---

app.get('/qz/certificate', (req, res) => {
    if (!certificate) {
        return res.status(404).json({
            error: 'Certificate not found. Please ensure QZ Tray certificates are properly configured.'
        });
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(certificate);
});

app.post('/qz/sign', (req, res) => {
    const { dataToSign } = req.body;

    if (!dataToSign) {
        return res.status(400).json({
            error: 'Missing dataToSign parameter'
        });
    }

    if (!privateKey) {
        return res.status(500).json({
            error: 'Server configuration error',
            details: 'Private key not configured.'
        });
    }

    try {
        const sign = crypto.createSign('SHA512');
        sign.update(dataToSign);
        sign.end();

        const signature = sign.sign(privateKey, 'base64');
        res.json({ success: true, signature });
    } catch (error) {
        logger.error('Signing failed:', error);
        res.status(500).json({
            error: 'Signing failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.options('/qz/{*any}', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
});

app.get('/qz/status', (req, res) => {
    res.json({
        certificateLoaded: !!certificate,
        privateKeyLoaded: !!privateKey,
        certificatePath: certPath,
        keyPath: keyPath,
        certificateExists: fs.existsSync(certPath),
        keyExists: fs.existsSync(keyPath)
    });
});

// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// --- ERROR HANDLING (REVISED) ---
app.use((err, req, res, next) => {
    if (err.isOperational) {
        logger.warn({
            status: 'Operational Error',
            statusCode: err.statusCode,
            message: err.message,
            path: req.originalUrl,
            method: req.method,
            ip: req.ip
        });
        return res.status(err.statusCode).json({
            status: 'fail',
            message: err.message,
        });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        let statusCode = 500;
        let message = 'A database operation failed. Please try again or contact support.';

        switch (err.code) {
            case 'P2002':
                statusCode = 409;
                const target = err.meta?.target;
                message = `A unique field value already exists: ${Array.isArray(target) ? target.join(', ') : target}. Please use another value.`;
                break;
            case 'P2025':
                statusCode = 404;
                message = `The requested resource could not be found. Details: ${err.meta?.cause}`;
                break;
            case 'P2003':
                statusCode = 400;
                message = `Invalid data provided. It seems to be related to a missing or invalid record. Details: ${err.meta?.field_name}`;
                break;
            case 'P2000':
                statusCode = 400;
                message = `An input value is too large or of the wrong type. Details: ${err.meta?.column_name}`;
                break;
            case 'P1000':
                statusCode = 500;
                message = 'A database authentication error occurred. Please check your credentials.';
                break;
            case 'P1001':
                statusCode = 503;
                message = 'Cannot reach the database server. It might be down or not configured correctly.';
                break;
            case 'P1008':
                statusCode = 408;
                message = 'The database operation timed out.';
                break;
            default:
                message = process.env.NODE_ENV === 'production' ? message : err.message;
        }

        logger.error({
            code: err.code,
            meta: err.meta,
            message: err.message,
            path: req.originalUrl
        });

        return res.status(statusCode).json({
            status: 'error',
            message,
        });
    }

    if (err.isJoi) {
        logger.warn({
            message: err.details.map(d => d.message).join(', '),
            path: req.originalUrl
        });
        return res.status(400).json({
            status: 'fail',
            message: err.details.map(d => d.message).join(', '),
        });
    }

    logger.fatal({
        error: err,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user ? req.user.username : 'unauthenticated'
    });

    res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong! Please try again later.' : err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// Catch all unhandled routes
app.all('{*any}', (req, res, next) => {
    next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// --- START SERVER ---
const server = app.listen(PORT, () => {
    logger.info(`Church Finance Management Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.fatal({ error: err, stack: err.stack }, 'UNHANDLED REJECTION! Shutting down...');
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.fatal({ error: err, stack: err.stack }, 'UNCAUGHT EXCEPTION! Shutting down...');
    server.close(() => {
        process.exit(1);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});