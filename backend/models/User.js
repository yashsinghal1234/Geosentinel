const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: 'Safety Officer',
  },
  role: {
    type: String,
    enum: ['admin', 'operator', 'citizen', 'manager'],
    default: 'operator',
  },
  badge: {
    type: String,
    default: 'OPERATOR',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.password_hash;
      delete ret.__v;
      return ret;
    }
  }
});

// Strict password comparison method using bcrypt
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password_hash) return false;
  try {
    return await bcrypt.compare(candidatePassword, this.password_hash);
  } catch (err) {
    return false;
  }
};

// Static helper to hash password
UserSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = User;
