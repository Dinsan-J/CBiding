const mongoose = require('mongoose');
const Auction = require('../models/Auction');

/**
 * Resolves an auction by MongoDB ObjectId or URL slug
 * @param {string} idOrSlug - Either a 24-character hex ObjectId or slug string
 * @returns {Promise<Object|null>} - Mongoose auction document or null
 */
async function resolveAuction(idOrSlug) {
  if (!idOrSlug) return null;

  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    const auctionById = await Auction.findById(idOrSlug);
    if (auctionById) return auctionById;
  }

  return await Auction.findOne({ slug: idOrSlug });
}

module.exports = { resolveAuction };
