const nodemailer = require('nodemailer');

// Get configurable values from environment
const getConfig = () => ({
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
  supportWhatsApp: process.env.SUPPORT_WHATSAPP || '+919876543210',
  appName: process.env.APP_NAME || 'GameBlast Mobile',
  appUrl: process.env.APP_URL || 'https://example.com',
  supportHours: process.env.SUPPORT_HOURS || '9 AM - 9 PM IST'
});

// Email configuration
const createTransporter = () => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  
  if (!smtpUser || !smtpPassword) {
    console.warn('⚠️ SMTP not configured - emails will not be sent');
    console.warn('   Set SMTP_USER and SMTP_PASSWORD in environment variables');
    return null;
  }
  
  // For Gmail SMTP (you can change this for other providers)
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPassword // App password for Gmail
    }
  });
};

// Send email notification to admin
const sendAdminNotification = async (subject, htmlContent, plainTextContent = null) => {
  try {
    const transporter = createTransporter();
    const config = getConfig();
    
    if (!transporter) {
      console.warn('⚠️ Email not sent - SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }
    
    const mailOptions = {
      from: config.supportEmail,
      to: config.adminEmail,
      subject: subject,
      html: htmlContent,
      text: plainTextContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for plain text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Admin notification sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return { success: false, error: error.message };
  }
};

// Send organiser signup notification to admin
const sendOrganiserSignupNotification = async (organiserData, userData) => {
  const config = getConfig();
  const subject = `🔔 New Organiser Registration Request - ${organiserData.organiser_name}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; color: #ff6b35;">🎮 ${config.appName}</h1>
        <h2 style="margin: 10px 0 0 0; font-weight: normal;">New Organiser Registration</h2>
      </div>
      
      <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h3 style="color: #1a1a2e; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">📋 Organiser Details</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold; width: 40%;">Real Name:</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${organiserData.real_name}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Organiser Name:</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${organiserData.organiser_name}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Email:</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${userData.email}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Username:</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${userData.username}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Personal Phone:</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${organiserData.personal_phone}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">WhatsApp:</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${organiserData.whatsapp_number || 'Not provided'}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Registration Date:</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
          </tr>
        </table>

        <h3 style="color: #1a1a2e; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">📄 Documents</h3>
        <p style="margin: 15px 0;">
          <strong>Aadhaar Front:</strong> <a href="${organiserData.aadhaar_front_url}" target="_blank" style="color: #ff6b35;">View Document</a><br>
          <strong>Aadhaar Back:</strong> <a href="${organiserData.aadhaar_back_url}" target="_blank" style="color: #ff6b35;">View Document</a>
        </p>

        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #856404;">⚠️ Action Required</h4>
          <p style="margin: 0; color: #856404;">
            Please review the organiser's details and documents. Log in to the admin panel to approve or reject this registration request.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.appUrl}/admin" 
             style="background-color: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            🔗 Open Admin Panel
          </a>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #1a1a2e;">💰 Monthly Fee Information</h4>
          <p style="margin: 0; color: #6c757d; font-size: 14px;">
            Monthly fee of ₹2,500 will be applicable once the organiser is approved and starts creating games.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
        <p>This is an automated notification from ${config.appName} Platform</p>
        <p>© ${new Date().getFullYear()} ${config.appName}. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendAdminNotification(subject, htmlContent);
};

// Send user contact form notification to admin
const sendContactFormNotification = async (contactData) => {
  const config = getConfig();
  const subject = `📧 New Contact Form Submission - ${contactData.name}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; color: #ff6b35;">🎮 ${config.appName}</h1>
        <h2 style="margin: 10px 0 0 0; font-weight: normal;">Contact Form Submission</h2>
      </div>
      
      <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold; width: 30%;">Name:</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${contactData.name}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Email:</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${contactData.email}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Phone:</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${contactData.phone || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Subject:</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${contactData.subject}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Submitted:</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
          </tr>
        </table>

        <h3 style="color: #1a1a2e; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">💬 Message</h3>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #ff6b35;">
          <p style="margin: 0; line-height: 1.6;">${contactData.message}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="mailto:${contactData.email}?subject=Re: ${contactData.subject}" 
             style="background-color: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            📧 Reply to User
          </a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
        <p>This is an automated notification from ${config.appName} Platform</p>
      </div>
    </div>
  `;

  return await sendAdminNotification(subject, htmlContent);
};

// Send general admin notification
const sendGeneralAdminNotification = async (title, message, data = {}) => {
  const config = getConfig();
  const subject = `🔔 ${config.appName} Admin Alert - ${title}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; color: #ff6b35;">🎮 ${config.appName}</h1>
        <h2 style="margin: 10px 0 0 0; font-weight: normal;">${title}</h2>
      </div>
      
      <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #ff6b35;">
          <p style="margin: 0; line-height: 1.6;">${message}</p>
        </div>

        ${Object.keys(data).length > 0 ? `
        <h3 style="color: #1a1a2e; border-bottom: 2px solid #ff6b35; padding-bottom: 10px; margin-top: 20px;">📊 Additional Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          ${Object.entries(data).map(([key, value], index) => `
          <tr ${index % 2 === 0 ? 'style="background-color: #f8f9fa;"' : ''}>
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold; width: 40%;">${key}:</td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${value}</td>
          </tr>
          `).join('')}
        </table>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.appUrl}/admin" 
             style="background-color: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            🔗 Open Admin Panel
          </a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
        <p>This is an automated notification from ${config.appName} Platform</p>
        <p>Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      </div>
    </div>
  `;

  return await sendAdminNotification(subject, htmlContent);
};

module.exports = {
  getConfig,
  sendAdminNotification,
  sendOrganiserSignupNotification,
  sendContactFormNotification,
  sendGeneralAdminNotification
};