const express = require('express');
const router = express.Router();

router.post('/submit', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    try {
      const emailService = require('../config/email');
      const contactData = { name, email, phone, subject, message };
      
      await emailService.sendContactFormNotification(contactData);
      console.log('Contact form notification sent to admin:', email);
      
      res.json({
        success: true,
        message: 'Thank you for your message! We will get back to you within 24 hours.'
      });
      
    } catch (emailError) {
      console.error('Failed to send contact form notification:', emailError);

      res.json({
        success: true,
        message: 'Thank you for your message! We will get back to you within 24 hours.',
        note: 'Message received, but there was an issue with email delivery. We will still respond to your inquiry.'
      });
    }

  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
});

module.exports = router;