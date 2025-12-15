/**
 * Email Service - Supports both SendGrid API and SMTP
 * 
 * CONFIGURATION GUIDE:
 * 
 * ========================================
 * FOR RENDER (Free Tier) - USE SENDGRID
 * ========================================
 * Render free tier blocks SMTP ports (25, 465, 587)
 * 
 * Set in Render Environment Variables:
 *   SENDGRID_API_KEY=SG.your_api_key_here
 *   SENDGRID_FROM_EMAIL=noreply@yourdomain.com (optional)
 * 
 * Leave SMTP variables empty/not set
 * 
 * ========================================
 * FOR VULTR/AWS/OTHER VPS - USE SMTP (Gmail)
 * ========================================
 * SMTP works perfectly on Vultr, AWS, and most VPS providers
 * 
 * Set in Environment Variables:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=your_email@gmail.com
 *   SMTP_PASS=your_app_password (not regular password!)
 *   SMTP_SECURE=false
 * 
 * To switch from SendGrid to SMTP:
 *   1. Remove/comment out SENDGRID_API_KEY in environment variables
 *   2. Set SMTP_HOST, SMTP_USER, SMTP_PASS
 *   3. Redeploy
 * 
 * PRIORITY: SendGrid (if SENDGRID_API_KEY is set) > SMTP (if configured)
 */

const nodemailer = require('nodemailer');

// ========================================
// SENDGRID CONFIGURATION (For Render Free Tier)
// ========================================
// Priority 1: If SENDGRID_API_KEY is set, use SendGrid API
// This works on Render free tier (no SMTP port blocking)
const useSendGrid = !!process.env.SENDGRID_API_KEY;

let sendgrid;
if (useSendGrid) {
  try {
    sendgrid = require('@sendgrid/mail');
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid API configured (works on Render free tier)');
    console.log('   From Email:', process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || 'noreply@linkcode.com');
  } catch (error) {
    console.error('❌ Failed to load SendGrid:', error.message);
  }
}

// ========================================
// SMTP CONFIGURATION (For Vultr/AWS/Other VPS)
// ========================================
// Priority 2: If SendGrid is not configured, use SMTP
// This works on Vultr, AWS, and most VPS providers
// Currently DISABLED on Render free tier (ports blocked)
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
  pool: false,
  maxConnections: 1,
  maxMessages: 1,
  requireTLS: process.env.SMTP_REQUIRE_TLS !== 'false',
  tls: {
    rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
  },
  debug: process.env.SMTP_DEBUG === 'true' || process.env.NODE_ENV === 'development',
  logger: process.env.SMTP_DEBUG === 'true' || process.env.NODE_ENV === 'development',
};

let transporter = null;
// Only initialize SMTP if SendGrid is NOT being used
if (!useSendGrid) {
  if (smtpConfig.host && smtpConfig.auth.user && smtpConfig.auth.pass) {
    transporter = nodemailer.createTransport(smtpConfig);
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ SMTP configuration error:', error.message);
        if (error.code === 'ETIMEDOUT') {
          console.error('   ⚠️  Connection timeout - Render free tier blocks SMTP ports!');
          console.error('   💡 Solution: Use SendGrid API instead (set SENDGRID_API_KEY)');
        }
      } else {
        console.log('✅ SMTP server is ready to send emails');
        console.log(`   Host: ${smtpConfig.host}:${smtpConfig.port}`);
        console.log(`   User: ${smtpConfig.auth.user}`);
      }
    });
  } else {
    console.warn('⚠️  No email service configured!');
    console.warn('   Option 1 (Render free tier): Set SENDGRID_API_KEY');
    console.warn('   Option 2 (Vultr/AWS/VPS): Set SMTP_HOST, SMTP_USER, SMTP_PASS');
  }
}

// ========================================
// SENDGRID EMAIL FUNCTION
// ========================================
/**
 * Send email using SendGrid API
 * Works on Render free tier (no SMTP port blocking)
 */
const sendEmailViaSendGrid = async (to, subject, html, fromEmail = null) => {
  if (!sendgrid) {
    throw new Error('SendGrid is not configured. Set SENDGRID_API_KEY environment variable.');
  }

  const from = fromEmail || process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || 'noreply@linkcode.com';
  
  // Log which email is being used as sender
  console.log(`   From Email: ${from}`);
  
  const msg = {
    to,
    from,
    subject,
    html,
  };

  try {
    await sendgrid.send(msg);
    console.log(`✅ Email sent via SendGrid to: ${to}`);
    return true;
  } catch (error) {
    console.error('❌ SendGrid error:', error.message);
    console.error(`   Attempted From Email: ${from}`);
    
    // Check if it's a sender verification error
    if (error.response && error.response.body && error.response.body.errors) {
      const errors = error.response.body.errors;
      const senderError = errors.find(e => e.field === 'from' || e.message.includes('Sender Identity'));
      
      if (senderError) {
        console.error('\n   ⚠️  SENDER VERIFICATION ERROR:');
        console.error(`   The email "${from}" is not verified in SendGrid.`);
        console.error('\n   📋 TO FIX THIS:');
        console.error('   1. Go to SendGrid Dashboard: https://app.sendgrid.com');
        console.error('   2. Click Settings → Sender Authentication');
        console.error('   3. Click "Verify a New Sender"');
        console.error(`   4. Verify the email: ${from}`);
        console.error('   5. Check your email inbox and click the verification link');
        console.error('   6. Make sure SENDGRID_FROM_EMAIL is set correctly in Render environment variables');
        console.error(`   7. Current SENDGRID_FROM_EMAIL: ${process.env.SENDGRID_FROM_EMAIL || 'NOT SET'}`);
        console.error(`   8. Current SMTP_USER: ${process.env.SMTP_USER || 'NOT SET'}`);
      }
    }
    
    if (error.response) {
      console.error('   Response body:', JSON.stringify(error.response.body, null, 2));
    }
    throw error;
  }
};

// ========================================
// SMTP EMAIL FUNCTION
// ========================================
/**
 * Send email using SMTP (Gmail, Outlook, etc.)
 * Works on Vultr, AWS, and most VPS providers
 * Does NOT work on Render free tier (ports blocked)
 */
const sendEmailViaSMTP = async (to, subject, html, fromEmail = null) => {
  if (!transporter) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.');
  }

  const mailOptions = {
    from: fromEmail || process.env.SMTP_USER,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent via SMTP to: ${to}`, info.messageId);
    return true;
  } catch (error) {
    console.error('❌ SMTP error:', error.message);
    throw error;
  }
};

// ========================================
// UNIVERSAL EMAIL SENDING FUNCTION
// ========================================
/**
 * Universal email sending function
 * Automatically uses SendGrid if available, otherwise falls back to SMTP
 * 
 * Priority: SendGrid (if SENDGRID_API_KEY is set) > SMTP (if configured)
 */
const sendEmail = async (to, subject, html, fromEmail = null) => {
  if (useSendGrid) {
    return await sendEmailViaSendGrid(to, subject, html, fromEmail);
  } else {
    return await sendEmailViaSMTP(to, subject, html, fromEmail);
  }
};

// ========================================
// EMAIL TEMPLATES
// ========================================

const sendWelcomeEmail = async (email, firstName, lastName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Welcome to Linkcode LMS, ${firstName}!</h2>
      <p>Dear ${firstName} ${lastName},</p>
      <p>Thank you for registering with Linkcode LMS. We're excited to have you on board!</p>
      <p>You can now log in to your account and start exploring our learning materials.</p>
      <p style="margin-top: 30px; color: #666;">Best regards,<br/>The Linkcode Team</p>
    </div>
  `;

  try {
    await sendEmail(email, 'Welcome to Linkcode LMS', html);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

const sendInstructorPasswordEmail = async (email, firstName, tempPassword) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Welcome to Linkcode LMS, ${firstName}!</h2>
      <p>Dear ${firstName},</p>
      <p>Your instructor account has been created by the admin. Please log in using the temporary password below and set your own secure password.</p>
      <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <p><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 5px 10px; border-radius: 3px;">${tempPassword}</code></p>
      </div>
      <p><strong>Steps to complete your setup:</strong></p>
      <ol>
        <li>Log in with the temporary password</li>
        <li>You will be redirected to set your new password</li>
        <li>Create a strong password that you'll remember</li>
        <li>After setting your password, you'll have full access to your account</li>
      </ol>
      <p style="color: #666; margin-top: 20px;">If you did not expect this email, please contact the admin immediately.</p>
      <p style="margin-top: 30px; color: #666;">Best regards,<br/>The Linkcode Team</p>
    </div>
  `;

  try {
    await sendEmail(email, 'Your Linkcode LMS Account has been Created', html);
    return true;
  } catch (error) {
    console.error('Error sending instructor password email:', error);
    throw error;
  }
};

const sendOTPEmail = async (email, otp, retries = 3) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Password Reset Request</h2>
      <p>We received a password reset request for your account.</p>
      <p>Use the OTP below to log in to your account. This OTP is valid for 10 minutes.</p>
      <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center;">
        <p style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 5px;">${otp}</p>
      </div>
      <p style="color: #666;">If you did not request this OTP, please ignore this email.</p>
      <p style="margin-top: 30px; color: #666;">Best regards,<br/>The Linkcode Team</p>
    </div>
  `;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Attempting to send email (attempt ${attempt + 1}/${retries + 1})...`);
      console.log(`   To: ${email}`);
      console.log(`   Method: ${useSendGrid ? 'SendGrid API' : 'SMTP'}`);
      
      await sendEmail(email, 'Your Linkcode LMS Login OTP', html);
      return true;
    } catch (error) {
      console.error(`❌ Email send attempt ${attempt + 1} failed:`, {
        code: error.code,
        message: error.message,
        method: useSendGrid ? 'SendGrid' : 'SMTP'
      });
      
      // Provide helpful error messages
      if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        console.error('   ⚠️  Connection timeout!');
        if (!useSendGrid) {
          console.error('   💡 Render free tier blocks SMTP ports (25, 465, 587)');
          console.error('   💡 Solution: Use SendGrid API - Set SENDGRID_API_KEY in Render environment variables');
        }
      } else if (error.code === 'EAUTH' || error.message.includes('authentication')) {
        console.error('   ⚠️  Authentication failed - Check your API key or credentials');
      }
      
      // If this is the last attempt, throw the error
      if (attempt === retries) {
        console.error('❌ All email send attempts failed');
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = (attempt + 1) * 2000; // 2s, 4s, 6s...
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = {
  sendWelcomeEmail,
  sendInstructorPasswordEmail,
  sendOTPEmail,
};
