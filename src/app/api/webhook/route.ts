import { NextResponse } from 'next/server';
import { Paddle, EventName } from '@paddle/paddle-node-sdk';
import nodemailer from 'nodemailer';

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

export async function POST(req: Request) {
  const signature = req.headers.get('paddle-signature') || '';
  // Paddle webhook signature verification requires the raw body
  const body = await req.text();
  const secret = process.env.PADDLE_WEBHOOK_SECRET || '';

  if (!signature || !secret) {
    console.error('Missing signature or secret');
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  try {
    // Verify the webhook signature
    const eventData = await paddle.webhooks.unmarshal(body, secret, signature);
    
    if (eventData && eventData.eventType === EventName.TransactionCompleted) {
       const transaction = eventData.data;
       console.log(`Processing transaction ${transaction.id}`);

       await sendEmail(transaction);
       await logToGoogleSheets(transaction);
    }
    
    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('Webhook Error:', e);
    return NextResponse.json({ error: `Webhook Error: ${e.message}` }, { status: 400 });
  }
}

async function sendEmail(transaction: any) {
  // Paddle customer email might be in customer object or directly if expanded
  // The user instruction says: data.customer.email
  const email = transaction.customer?.email || transaction.customer_details?.email;
  
  if (!email) {
    console.warn('No email found in transaction');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Little Skylark" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Thank you for your purchase! - Little Skylark Tutorial',
    text: `Thank you for purchasing Little Skylark Tutorial!
    
Here is your access link to the course materials:
${process.env.GOOGLE_DRIVE_COURSE_LINK}

If you have any questions, please reply to this email.

Best regards,
Little Skylark Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Thank you for your purchase!</h1>
        <p>We are excited to have you on board with Little Skylark Tutorial.</p>
        <p>You can access your course materials using the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.GOOGLE_DRIVE_COURSE_LINK}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Access Course</a>
        </div>
        <p>Or copy this link: ${process.env.GOOGLE_DRIVE_COURSE_LINK}</p>
        <hr />
        <p>If you have any questions, please reply to this email.</p>
        <p>Best regards,<br>Little Skylark Team</p>
      </div>
    `,
  };

  try {
     await transporter.sendMail(mailOptions);
     console.log(`Email sent to ${email}`);
  } catch (err) {
      console.error('Failed to send email:', err);
  }
}

async function logToGoogleSheets(transaction: any) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('GOOGLE_SHEET_WEBHOOK_URL not configured');
    return;
  }

  // Extract amount from details.totals.grand_total (string) or total (string)
  // Paddle uses string for money
  const amount = transaction.details?.totals?.grand_total || transaction.details?.totals?.total || '0';
  
  // Extract custom data for product name
  // Note: customData keys might be camelCase or original case depending on how it was passed
  const productName = transaction.custom_data?.productName || transaction.customData?.productName || 'Unknown Product';

  const payload = {
    email: transaction.customer?.email || transaction.customer_details?.email || '',
    productName: productName,
    amount: amount, // Keeping it as string or number? Google Sheets usually handles both. 
                    // But previous code converted to number. 
                    // Stripe amount was in cents, Paddle is in major units (e.g. "5.99").
                    // Let's keep it as is or parse float if needed.
    sessionId: transaction.id,
    date: new Date().toISOString(),
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Google Sheets Webhook failed with status ${response.status}`);
  }
  
  console.log('Logged to Google Sheets');
}
