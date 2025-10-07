// app/api/contact/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

const isProd = process.env.NODE_ENV === 'production';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
async function safeJson(req: NextRequest) {
  try { return await req.json(); } catch { return {}; }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, subject, message, honey } = await safeJson(req);

    // honeypot
    if (honey) return NextResponse.json({ ok: true });

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    // env
    const host = process.env.MAIL_HOST!;
    const port = Number(process.env.MAIL_PORT || 587);
    const user = process.env.MAIL_USER!;
    const pass = process.env.MAIL_PASS!;
    const from = process.env.MAIL_FROM!;
    const to   = process.env.MAIL_TO || user;
    const sni  = process.env.MAIL_SNI || host;
    const requireTLS = (process.env.MAIL_REQUIRE_TLS ?? 'true') !== 'false';
    const rejectUnauthorized = (process.env.MAIL_TLS_REJECT_UNAUTHORIZED ?? 'true') !== 'false';

    if (!host || !user || !pass || !from) {
      return NextResponse.json({ error: 'Mail server not configured.' }, { status: 500 });
    }

    const secure = port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,                      // 465 = implicit TLS; 587 = STARTTLS
      requireTLS: !secure && requireTLS,
      auth: { user, pass },
      tls: {
        servername: sni,           // <-- matches cert CN/SAN (fixes SNI mismatch)
        rejectUnauthorized,        // set false ONLY when testing
        minVersion: 'TLSv1.2',
      },
      socketTimeout: 15000,
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      logger: !isProd,
      debug: !isProd,
    });

    // show immediate, precise SMTP errors while debugging
    try {
      await transporter.verify();
    } catch (error) {
      console.error('SMTP verify failed:', error);
      let errorMessage = 'Unknown error';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as Record<string, unknown>).message);
      } else {
        errorMessage = String(error);
      }
      return NextResponse.json(
        { error: 'SMTP connection failed.', detail: isProd ? undefined : errorMessage },
        { status: 500 }
      );
    }

    // Admin mail
    await transporter.sendMail({
      from,
      to,
      replyTo: email,
      subject: `[Contact] ${subject || 'New message'} — ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        phone ? `Phone: ${phone}` : '',
        subject ? `Subject: ${subject}` : '',
        '',
        message,
      ].filter(Boolean).join('\n'),
      html: `
        <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
          <h2>New contact message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
          <hr />
          <pre style="white-space:pre-wrap;font-family:inherit">${message}</pre>
        </div>
      `,
    });

    // Auto-reply
    await transporter.sendMail({
      from,
      to: email,
      subject: 'We received your message — Delightful Naturals',
      text: `Hi ${name},

Thanks for contacting Delightful Naturals. We’ve received your message and will reply shortly.

— Team Delightful Naturals`,
      html: `
        <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
          <p>Hi ${name},</p>
          <p>Thanks for contacting <strong>Delightful Naturals</strong>. We’ve received your message and will reply shortly.</p>
          <p>— Team Delightful Naturals</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Contact send error:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error && 'message' in error
        ? String((error as Record<string, unknown>).message)
        : String(error);
    return NextResponse.json(
      { error: 'Failed to send message.', detail: isProd ? undefined : errorMessage },
      { status: 500 }
    );
  }
}

// Silence 405s in dev logs
export async function GET() {
  return NextResponse.json({ status: 'ready' }, { status: 200 });
}
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
