const mongoose = require('mongoose');

const bountySchema = new mongoose.Schema({
  // On-chain data
  contractId: {
    type: Number,
    required: true,
    unique: true
  },
  clientAddress: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[A-Z2-7]{58}$/.test(v); // Algorand address validation
      },
      message: 'Invalid Algorand address'
    }
  },
  freelancerAddress: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^[A-Z2-7]{58}$/.test(v);
      },
      message: 'Invalid Algorand address'
    }
  },
  verifierAddress: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^[A-Z2-7]{58}$/.test(v);
      },
      message: 'Invalid Algorand address'
    }
  },
  amount: {
    type: Number,
    required: true,
    min: 0.001 // Minimum 0.001 ALGO
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'accepted', 'approved', 'claimed', 'refunded'],
    default: 'open'
  },

  // Off-chain metadata
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  requirements: [{
    type: String,
    maxlength: 500
  }],
  tags: [{
    type: String,
    maxlength: 50
  }],

  // Submissions
  submissions: [{
    freelancerAddress: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000
    },
    links: [{
      type: String,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Invalid URL'
      }
    }],
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bountySchema.index({ contractId: 1 });
bountySchema.index({ clientAddress: 1 });
bountySchema.index({ freelancerAddress: 1 });
bountySchema.index({ status: 1 });
bountySchema.index({ deadline: 1 });
bountySchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
bountySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Bounty', bountySchema);
