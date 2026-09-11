const mongoose = require('mongoose');

const CheckinSchema = new mongoose.Schema({
  user_name: {
    type: String,
    default: 'Resident',
  },
  phone: {
    type: String,
    default: '',
  },
  alert_id: {
    type: String,
    default: null,
  },
  zone: {
    type: String,
    default: 'Sector 1',
  },
  status: {
    type: String,
    enum: ['safe', 'need_assistance', 'in_shelter', 'evacuating'],
    default: 'safe',
  },
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },
  members_count: {
    type: Number,
    default: 1,
  },
  notes: {
    type: String,
    default: '',
  },
  submitted_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const Checkin = mongoose.models.Checkin || mongoose.model('Checkin', CheckinSchema);

module.exports = Checkin;
