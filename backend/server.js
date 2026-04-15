const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
let cachedConnection = null;

const validateRequiredEnv = () => {
  const missing = [];

  if (!process.env.JWT_SECRET) {
    missing.push('JWT_SECRET');
  }

  const hasEmailUser = Boolean(process.env.EMAIL_USER || process.env.SMTP_USER);
  const hasEmailPass = Boolean(process.env.EMAIL_PASS || process.env.SMTP_PASS);

  if (!hasEmailUser) {
    missing.push('EMAIL_USER or SMTP_USER');
  }

  if (!hasEmailPass) {
    missing.push('EMAIL_PASS or SMTP_PASS');
  }

  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach((key) => console.error(`- ${key}`));
    return false;
  }

  return true;
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache MongoDB connection across serverless invocations.
const connectToMongoDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  cachedConnection = mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await cachedConnection;
    console.log('MongoDB Connected');
    return cachedConnection;
  } catch (err) {
    cachedConnection = null;
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

app.use(async (req, res, next) => {
  try {
    await connectToMongoDB();
    next();
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/evaluations', require('./routes/evaluations'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  if (!validateRequiredEnv()) {
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

