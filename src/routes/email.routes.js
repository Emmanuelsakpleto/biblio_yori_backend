const express = require('express');
const router = express.Router();
const emailService = require('../services/email.service');

// Route générique d'envoi d'email (protégée ou à restreindre selon usage)
router.post('/send', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;
    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Champs requis manquants.' });
    }
    await emailService.sendEmail(to, subject, html, text);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email.' });
  }
});

module.exports = router;
