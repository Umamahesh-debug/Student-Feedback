const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    required: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  // Student specific fields
  rollNumber: {
    type: String,
    default: ''
  },
  branch: {
    type: String,
    default: ''
  },
  section: {
    type: String,
    default: ''
  },
  // Teacher specific fields
  verifiedTeacher: {
    type: Boolean,
    default: false
  },
  department: {
    type: String,
    default: ''
  },
  designation: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  // Email verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailOTP: {
    type: String,
    default: null
  },
  emailOTPExpires: {
    type: Date,
    default: null
  },
  // Password reset
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

