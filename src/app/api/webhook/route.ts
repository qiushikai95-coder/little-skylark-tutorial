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
       // Log full webhook payload for debugging email extraction
       console.log('Webhook payload:', JSON.stringify(body, null, 2));

       await processTransaction(transaction);
    }
    
    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('Webhook Error:', e);
    return NextResponse.json({ error: `Webhook Error: ${e.message}` }, { status: 400 });
  }
}

async function processTransaction(transaction: any) {
  // 1. Correctly extract buyer email
  // Paddle v2 structure might vary depending on whether customer is expanded or not.
  // We check multiple possible locations.
  let buyerEmail = '';
  
  if (transaction.customer?.email) {
      buyerEmail = transaction.customer.email;
  } else if (transaction.details?.checkout?.customer?.email) {
      buyerEmail = transaction.details.checkout.customer.email;
  } else if (transaction.customer_details?.email) {
      buyerEmail = transaction.customer_details.email;
  } else if (transaction.customer_id) {
      // Fetch customer email using customer_id
      try {
          console.log(`Fetching customer details for ID: ${transaction.customer_id}`);
          const customer = await paddle.customers.get(transaction.customer_id);
          buyerEmail = customer.email;
          console.log(`Fetched email from API: ${buyerEmail}`);
      } catch (err) {
          console.error('Failed to fetch customer details:', err);
      }
  } else if (transaction.custom_data?.email) {
      // Sometimes passed via custom_data
      buyerEmail = transaction.custom_data.email;
  } else if (transaction.origin === 'web' && transaction.details?.customer?.email) {
      // Legacy or specific web checkout structure
      buyerEmail = transaction.details.customer.email;
  }


  console.log(`Extracted Buyer Email: ${buyerEmail}`);

  if (buyerEmail) {
    await sendEmail(buyerEmail);
  } else {
    console.error('CRITICAL: Failed to extract buyer email from transaction data.');
  }

  // 2. Log to Google Sheets with amount conversion
  await logToGoogleSheets(transaction, buyerEmail);
}

async function sendEmail(email: string) {
  console.log(`Attempting to send email to: ${email}`);
  
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
     const info = await transporter.sendMail(mailOptions);
     console.log(`Email sent successfully to ${email}. MessageId: ${info.messageId}`);
  } catch (err) {
      console.error('Failed to send email:', err);
  }
}

async function logToGoogleSheets(transaction: any, email: string) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('GOOGLE_SHEET_WEBHOOK_URL not configured');
    return;
  }

  // Extract amount from details.totals.grand_total (string)
  // Paddle v2 usually sends this as a string representing the major unit (e.g. "9.99"),
  // BUT the user says it is in cents (e.g. 990). Let's handle conversion safely.
  // If it's a string "990" representing cents, we divide by 100.
  // If it's "9.90", dividing by 100 would be wrong.
  // Paddle Billing (v2) API docs say `totals.grand_total` is a string representing the amount in the currency's minor unit? 
  // Wait, standard Paddle Billing API usually returns `totals.grand_total` as a string like "1000" for $10.00.
  // So dividing by 100 is correct for converting cents to dollars.
  
  let rawAmount = transaction.details?.totals?.grand_total || '0';
  let amount = parseFloat(rawAmount);
  
  // Basic heuristic: if the amount seems to be in cents (integer > 100 usually), convert to dollars.
  // Or strictly follow user instruction: "Paddle 传过来的金额（比如 990）是最小货币单位（分），请...除以 100"
  if (!isNaN(amount)) {
      amount = amount / 100;
  }

  // Extract custom data for product name
  const productName = transaction.custom_data?.productName || transaction.customData?.productName || 'Unknown Product';

  const payload = {
    email: email, // Use the extracted email
    productName: productName,
    amount: amount.toFixed(2), // Format as 2 decimal string
    sessionId: transaction.id,
    date: new Date().toISOString(),
  };

  console.log('Logging to Google Sheets with payload:', JSON.stringify(payload));

  try {
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
    
    console.log('Logged to Google Sheets successfully');
  } catch (error) {
      console.error('Failed to log to Google Sheets:', error);
  }
}
