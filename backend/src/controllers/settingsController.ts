import { Request, Response } from 'express';
import { db, Settings } from '../services/db.js';

/**
 * Controller to manage client-side settings and master database resetting
 */
export const settingsController = {
  // Retrieve settings
  getSettings: (req: Request, res: Response): void => {
    try {
      const settings = db.settings.read();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve settings' });
    }
  },

  // Update configurations
  updateSettings: (req: Request, res: Response): void => {
    try {
      const { userName, currency, themeAccent } = req.body;
      const settings = db.settings.read();

      if (userName !== undefined) {
        if (typeof userName !== 'string' || userName.trim() === '') {
          res.status(400).json({ error: 'Valid username is required' });
          return;
        }
        settings.userName = userName.trim();
      }

      if (currency !== undefined) {
        if (typeof currency !== 'string' || currency.trim() === '') {
          res.status(400).json({ error: 'Valid currency symbol is required' });
          return;
        }
        settings.currency = currency.trim();
      }

      if (themeAccent !== undefined) {
        if (typeof themeAccent !== 'string' || themeAccent.trim() === '') {
          res.status(400).json({ error: 'Valid theme accent is required' });
          return;
        }
        settings.themeAccent = themeAccent.trim();
      }

      db.settings.save(settings);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  },

  // Reset entire application data back to default templates
  resetDatabase: (req: Request, res: Response): void => {
    try {
      db.resetAll();
      res.json({ success: true, message: 'All database tables purged and seeded cleanly' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reset database' });
    }
  }
};
