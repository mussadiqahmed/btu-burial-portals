/* Lazy-load nodemailer so the API still starts if npm install was not run yet. */

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function loadNodemailer() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('nodemailer');
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

function createTransport() {
  const nodemailer = loadNodemailer();
  if (!nodemailer) {
    throw new Error(
      'nodemailer is not installed on the server. In cPanel Terminal, cd to endless_api and run: npm install --production'
    );
  }

  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== 'false' && port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    ...(port === 587 && { requireTLS: true }),
  });
}

/** Safe default — avoids angle brackets in .env (breaks cPanel shell export). */
export function getSmtpFromAddress(): string {
  if (process.env.SMTP_FROM?.trim()) {
    return process.env.SMTP_FROM.trim();
  }
  const user = process.env.SMTP_USER || 'quotes@eem.co.bw';
  return `"Endless Eternity Memorials" <${user}>`;
}

export async function sendQuotationEmail(options: {
  to: string;
  clientName: string;
  quotationId: number;
  pdfBuffer: Buffer;
  message?: string;
}) {
  if (!isEmailConfigured()) {
    throw new Error(
      'Email is not configured on the server. Add SMTP_HOST, SMTP_USER, and SMTP_PASS to the API .env file (cPanel email account).'
    );
  }

  const transporter = createTransport();
  const filename = `Quotation-Q${options.quotationId}-${options.clientName.replace(/\s+/g, '_')}.pdf`;

  await transporter.sendMail({
    from: getSmtpFromAddress(),
    to: options.to,
    subject: `Quotation Q-${options.quotationId} — ${options.clientName} | Endless Eternity Memorials`,
    text: [
      `Dear ${options.clientName},`,
      '',
      'Please find your quotation from Endless Eternity Memorials attached.',
      options.message ? `\n${options.message}\n` : '',
      '',
      'Plot 9160, Pilane Industrial, Gaborone',
      'Tel: +267 575 0093 / 78 395 266',
      '',
      'Thank you for your enquiry.',
    ].join('\n'),
    html: `
      <p>Dear ${options.clientName},</p>
      <p>Please find your quotation <strong>Q-${options.quotationId}</strong> attached as a PDF.</p>
      ${options.message ? `<p>${options.message.replace(/\n/g, '<br>')}</p>` : ''}
      <p>Plot 9160, Pilane Industrial, Gaborone<br>
      Tel: +267 575 0093 / 78 395 266</p>
      <p>Thank you for choosing <strong>Endless Eternity Memorials</strong>.</p>
    `,
    attachments: [
      {
        filename,
        content: options.pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}
