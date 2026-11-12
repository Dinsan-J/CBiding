const https = require('https');
const PlayerAcquisition = require('../models/PlayerAcquisition');

class WhatsAppNotificationService {
  /**
   * Check if WhatsApp Business API credentials are fully configured in environment
   */
  static isConfigured() {
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    return Boolean(phoneId && token && phoneId.trim() !== '' && token.trim() !== '');
  }

  /**
   * Send WhatsApp notification when a player is hammered SOLD
   */
  static async sendAcquisitionAlert({ player, team, acquisition, auction }) {
    const contact = (player?.contactNumber || '').replace(/[^0-9+]/g, '');

    if (!contact) {
      console.log(`[WhatsApp] Skipped: No valid contact number for ${player?.fullName || 'player'}`);
      if (acquisition?._id) {
        await PlayerAcquisition.findByIdAndUpdate(acquisition._id, {
          whatsAppNotificationStatus: 'NOT_APPLICABLE'
        });
      }
      return {
        success: false,
        status: 'NOT_APPLICABLE',
        reason: 'Player profile does not have a contact number.'
      };
    }

    if (!this.isConfigured()) {
      console.log(`[WhatsApp] Gateway Not Configured: WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN missing in .env`);
      if (acquisition?._id) {
        await PlayerAcquisition.findByIdAndUpdate(acquisition._id, {
          whatsAppNotificationStatus: 'FAILED'
        });
      }
      return {
        success: false,
        status: 'FAILED',
        reason: 'WhatsApp Business API credentials (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN) are not configured in environment variables.'
      };
    }

    // Format formatted currency
    const formattedAmount = (acquisition?.finalBidAmount || player?.finalPrice || 0).toLocaleString();
    const messageBody = `🏏 *BidX Auction Acquisition Alert*\n\n` +
      `Congratulations *${player.fullName}*!\n` +
      `You have been officially acquired by *${team.name}* (${team.shortName}) for *${auction.currency} ${formattedAmount}* in *${auction.title}*.\n\n` +
      `View official squad roster: https://bidxnew.vercel.app/teams`;

    try {
      const payload = JSON.stringify({
        messaging_product: 'whatsapp',
        to: contact.startsWith('+') ? contact.slice(1) : contact,
        type: 'text',
        text: { body: messageBody }
      });

      const options = {
        hostname: 'graph.facebook.com',
        path: `/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const result = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve({ statusCode: res.statusCode, data: parsed });
            } catch (e) {
              resolve({ statusCode: res.statusCode, raw: data });
            }
          });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
          req.destroy(new Error('WhatsApp API request timed out'));
        });
        req.write(payload);
        req.end();
      });

      const isDelivered = result.statusCode >= 200 && result.statusCode < 300;
      const status = isDelivered ? 'SENT' : 'FAILED';

      if (acquisition?._id) {
        await PlayerAcquisition.findByIdAndUpdate(acquisition._id, {
          whatsAppNotificationStatus: status
        });
      }

      console.log(`[WhatsApp] Alert dispatched for ${player.fullName} (${contact}): ${status}`);
      return { success: isDelivered, status, result };
    } catch (err) {
      console.error(`[WhatsApp] Failed to dispatch alert:`, err.message);
      if (acquisition?._id) {
        await PlayerAcquisition.findByIdAndUpdate(acquisition._id, {
          whatsAppNotificationStatus: 'FAILED'
        });
      }
      return { success: false, status: 'FAILED', error: err.message };
    }
  }
}

module.exports = WhatsAppNotificationService;
