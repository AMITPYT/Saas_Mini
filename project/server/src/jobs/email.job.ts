import { Job, Worker } from 'bullmq';
import { config } from '../config';
import { logger } from '../utils/logger';
import { QUEUE_NAMES } from '../config/queue';

interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

interface WelcomeEmailData {
  email: string;
  name: string;
}

interface PasswordResetEmailData {
  email: string;
  name: string;
  resetToken: string;
  resetUrl: string;
}

interface InviteEmailData {
  email: string;
  inviterName: string;
  workspaceName: string;
  inviteUrl: string;
}

interface NotificationEmailData {
  email: string;
  name: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
};

// Email sending function (placeholder - integrate with actual email service)
const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  // In production, use services like:
  // - SendGrid
  // - AWS SES
  // - Nodemailer with SMTP
  // - Resend
  // - Postmark

  logger.info(`[EMAIL] Sending to: ${to}`);
  logger.info(`[EMAIL] Subject: ${subject}`);
  logger.debug(`[EMAIL] Content: ${html.substring(0, 200)}...`);

  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  logger.info(`[EMAIL] Sent successfully to: ${to}`);
};

// Email templates
const templates = {
  welcome: (data: WelcomeEmailData): { subject: string; html: string } => ({
    subject: 'Welcome to SaaS App!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Welcome, ${data.name}!</h1>
        <p>Thank you for signing up for SaaS App. We're excited to have you on board.</p>
        <p>Get started by:</p>
        <ul>
          <li>Creating your first workspace</li>
          <li>Inviting your team members</li>
          <li>Setting up your first board</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The SaaS App Team</p>
      </div>
    `,
  }),

  passwordReset: (data: PasswordResetEmailData): { subject: string; html: string } => ({
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Password Reset Request</h1>
        <p>Hi ${data.name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${data.resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Best regards,<br>The SaaS App Team</p>
      </div>
    `,
  }),

  invite: (data: InviteEmailData): { subject: string; html: string } => ({
    subject: `${data.inviterName} invited you to join ${data.workspaceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>You're Invited!</h1>
        <p>${data.inviterName} has invited you to join <strong>${data.workspaceName}</strong> on SaaS App.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${data.inviteUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Accept Invitation
          </a>
        </p>
        <p>Best regards,<br>The SaaS App Team</p>
      </div>
    `,
  }),

  notification: (data: NotificationEmailData): { subject: string; html: string } => ({
    subject: data.title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>${data.title}</h1>
        <p>Hi ${data.name},</p>
        <p>${data.message}</p>
        ${
          data.actionUrl
            ? `
        <p style="text-align: center; margin: 30px 0;">
          <a href="${data.actionUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            ${data.actionText || 'View Details'}
          </a>
        </p>
        `
            : ''
        }
        <p>Best regards,<br>The SaaS App Team</p>
      </div>
    `,
  }),
};

// Process email jobs
const processEmailJob = async (job: Job<EmailJobData>): Promise<void> => {
  const { to, template, data } = job.data;

  let emailContent: { subject: string; html: string };

  switch (template) {
    case 'welcome':
      emailContent = templates.welcome(data as unknown as WelcomeEmailData);
      break;
    case 'password-reset':
      emailContent = templates.passwordReset(data as unknown as PasswordResetEmailData);
      break;
    case 'invite':
      emailContent = templates.invite(data as unknown as InviteEmailData);
      break;
    case 'notification':
      emailContent = templates.notification(data as unknown as NotificationEmailData);
      break;
    default:
      throw new Error(`Unknown email template: ${template}`);
  }

  await sendEmail(to, emailContent.subject, emailContent.html);
};

// Create email worker
export const createEmailWorker = (): Worker => {
  const worker = new Worker(QUEUE_NAMES.EMAIL, processEmailJob, {
    connection,
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    logger.debug(`Email job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Email job ${job?.id} failed:`, err);
  });

  return worker;
};

// Helper functions to queue emails
export const queueWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const { emailQueue, addJob } = await import('../config/queue');
  await addJob(emailQueue, 'welcome-email', {
    to: email,
    template: 'welcome',
    data: { email, name },
  });
};

export const queuePasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<void> => {
  const { emailQueue, addJob } = await import('../config/queue');
  const resetUrl = `${config.cors.origin}/reset-password?token=${resetToken}`;
  await addJob(emailQueue, 'password-reset-email', {
    to: email,
    template: 'password-reset',
    data: { email, name, resetToken, resetUrl },
  });
};

export const queueInviteEmail = async (
  email: string,
  inviterName: string,
  workspaceName: string,
  inviteToken: string
): Promise<void> => {
  const { emailQueue, addJob } = await import('../config/queue');
  const inviteUrl = `${config.cors.origin}/invite?token=${inviteToken}`;
  await addJob(emailQueue, 'invite-email', {
    to: email,
    template: 'invite',
    data: { email, inviterName, workspaceName, inviteUrl },
  });
};

export const queueNotificationEmail = async (
  email: string,
  name: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): Promise<void> => {
  const { emailQueue, addJob } = await import('../config/queue');
  await addJob(emailQueue, 'notification-email', {
    to: email,
    template: 'notification',
    data: { email, name, title, message, actionUrl, actionText },
  });
};
