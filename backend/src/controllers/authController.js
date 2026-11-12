const User = require('../models/User');
const Tenant = require('../models/Tenant');

// @desc    Auth User & Get Token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { identifier, email, username, password } = req.body;
    const loginId = (identifier || email || username || '').trim().toLowerCase();
    const loginPw = (password || '').trim();

    if (!loginId || !loginPw) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both username/email and password.'
      });
    }

    // Find by email or username
    const user = await User.findOne({
      $or: [{ email: loginId }, { username: loginId }]
    }).populate('tenantId');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User does not exist.'
      });
    }

    const isMatch = await user.matchPassword(loginPw);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Password incorrect.'
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        role: user.role,
        tenantId: user.tenantId?._id || user.tenantId,
        tenantName: user.tenantId?.name || 'Default Tenant'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current Logged in User
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('tenantId');
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register Organiser & Workspace
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, orgName } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists.'
      });
    }

    // Create Tenant Workspace
    const slug = (orgName || fullName)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    const tenant = await Tenant.create({
      name: orgName || `${fullName}'s Workspace`,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      contactEmail: email.toLowerCase()
    });

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      username: email.split('@')[0].toLowerCase(),
      passwordHash: password,
      role: 'ORGANISER',
      tenantId: tenant._id
    });

    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        tenantId: tenant._id
      }
    });
  } catch (error) {
    next(error);
  }
};
