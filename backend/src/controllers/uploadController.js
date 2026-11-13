const CloudinaryUploadService = require('../services/CloudinaryUploadService');

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Choose an image file to upload.' });
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(req.file.mimetype)) {
      return res.status(415).json({ success: false, error: 'Only image files are supported.' });
    }
    const imageUrl = await CloudinaryUploadService.uploadImage(req.file);
    res.status(201).json({ success: true, data: { url: imageUrl } });
  } catch (error) {
    next(error);
  }
};
