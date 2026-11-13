const crypto = require('crypto');

exports.uploadImage = async (file, folder = 'bidx') => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    const error = new Error('Image uploads are not configured. Set the Cloudinary credentials on the backend.');
    error.statusCode = 503;
    throw error;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
    .digest('hex');
  const form = new FormData();
  form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form
  });
  const result = await response.json();
  if (!response.ok || !result.secure_url) {
    const error = new Error(result.error?.message || 'Image upload failed.');
    error.statusCode = response.status >= 500 ? 502 : 400;
    throw error;
  }
  return result.secure_url;
};
