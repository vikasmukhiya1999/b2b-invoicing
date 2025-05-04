import User from '../models/User.js';

// @desc    Submit KYC information
// @route   POST /api/kyc/submit
// @access  Private
export const submitKYC = async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      taxId,
      address,
      phone,
      website
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.kyc = {
      businessName,
      businessType,
      taxId,
      address,
      phone,
      website,
      verificationStatus: 'pending'
    };
    user.kycCompleted = true;

    await user.save();

    res.json({
      message: 'KYC information submitted successfully',
      kyc: user.kyc,
      kycCompleted: user.kycCompleted
    });
  } catch (err) {
    console.error('KYC submission error:', err.message);
    res.status(500).json({ message: 'Server error while submitting KYC' });
  }
};

// @desc    Get KYC status
// @route   GET /api/kyc/status
// @access  Private
export const getKYCStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('kyc kycCompleted');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      kyc: user.kyc,
      kycCompleted: user.kycCompleted
    });
  } catch (err) {
    console.error('KYC status check error:', err.message);
    res.status(500).json({ message: 'Server error while checking KYC status' });
  }
};