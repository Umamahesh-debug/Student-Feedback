const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { sendOTPEmail, sendPasswordResetOTPEmail } = require('../utils/email');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'teacher']).withMessage('Role must be student or teacher')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, rollNumber, branch, section, department, designation, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate 6-digit OTP (expires 15 min)
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Create user data
    const userData = {
      name,
      email,
      password,
      role,
      isEmailVerified: false,
      emailOTP: otp,
      emailOTPExpires: otpExpires
    };

    if (role === 'student') {
      userData.rollNumber = rollNumber || '';
      userData.branch = branch || '';
      userData.section = section || '';
    } else if (role === 'teacher') {
      userData.department = department || '';
      userData.designation = designation || '';
      userData.phone = phone || '';
      userData.verifiedTeacher = false;
    }

    const user = new User(userData);
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail(email, name, otp);
      console.log(`[OTP] Sent to ${email} - OTP: ${otp}`);
    } catch (emailErr) {
      // Delete the user so they can retry registration
      await User.deleteOne({ _id: user._id });
      console.error('OTP email failed:', emailErr.message);
      return res.status(500).json({
        message: 'Failed to send OTP email. Please check your email address and try again.',
        emailError: emailErr.message
      });
    }

    return res.status(201).json({
      pendingVerification: true,
      message: 'Registration successful! An OTP has been sent to your email.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Valid email required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified. Please login.' });
    }

    if (!user.emailOTP || user.emailOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }

    if (user.emailOTPExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    user.isEmailVerified = true;
    user.emailOTP = null;
    user.emailOTPExpires = null;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully! You can now login.' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resend OTP
router.post('/resend-otp', [
  body('email').isEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email.' });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    const otp = generateOTP();
    user.emailOTP = otp;
    user.emailOTPExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    try {
      await sendOTPEmail(email, user.name, otp);
      console.log(`[OTP] Resent to ${email} - OTP: ${otp}`);
    } catch (emailErr) {
      console.error('Resend OTP email failed:', emailErr.message);
    }

    res.json({ message: 'A new OTP has been sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check email verification
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        emailNotVerified: true,
        email: user.email
      });
    }

    // Check if teacher is approved by admin
    if (user.role === 'teacher' && !user.verifiedTeacher) {
      return res.status(403).json({
        message: 'Your teacher account is pending admin approval.',
        pendingApproval: true,
        userInfo: {
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        verifiedTeacher: user.verifiedTeacher
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot Password — send OTP to email
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Always return success to not reveal if email exists
      return res.json({ message: 'If an account with that email exists, an OTP has been sent.' });
    }

    const otp = generateOTP();
    user.passwordResetToken = otp;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetOTPEmail(email, user.name, otp);
      console.log(`[RESET OTP] Sent to ${email} - OTP: ${otp}`);
    } catch (emailErr) {
      console.error('Password reset OTP email failed:', emailErr.message);
      return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }

    res.json({ message: 'OTP sent to your email. Enter it below to reset your password.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify Reset OTP — returns a short-lived reset token
router.post('/verify-reset-otp', [
  body('email').isEmail().withMessage('Valid email required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      passwordResetToken: otp,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please try again.' });
    }

    // OTP is valid — generate a short-lived reset token (10 min)
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    // Clear the OTP now that it's verified
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ message: 'OTP verified successfully.', resetToken });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset Password — uses the reset token from verify-reset-otp
router.post('/reset-password', [
  body('resetToken').notEmpty().withMessage('Reset token required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { resetToken, password } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Reset session expired. Please start over.' });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid reset token.' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.password = password;
    await user.save();

    res.json({ message: 'Password reset successfully! You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
