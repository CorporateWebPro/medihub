const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderType: {
    type: String,
    enum: ['purchase', 'quote_request', 'bulk_inquiry'],
    default: 'purchase'
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    customizations: [{
      name: String,
      value: String,
      additionalCost: {
        type: Number,
        default: 0
      }
    }],
    // For quote requests
    requestedDeliveryDate: Date,
    specifications: String
  }],
  // Pricing Summary
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    vatAmount: {
      type: Number,
      default: 0
    },
    vatRate: {
      type: Number,
      default: 16
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    discountCode: String,
    shippingCost: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'KES'
    }
  },
  // Customer Information
  customerInfo: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    organizationName: String,
    licenseNumber: String
  },
  // Shipping Address
  shippingAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    county: {
      type: String,
      required: true
    },
    postalCode: String,
    country: {
      type: String,
      default: 'Kenya'
    },
    deliveryInstructions: String
  },
  // Billing Address
  billingAddress: {
    street: String,
    city: String,
    county: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Kenya'
    },
    sameAsShipping: {
      type: Boolean,
      default: true
    }
  },
  // Order Status
  status: {
    type: String,
    enum: [
      'pending_payment',
      'payment_failed',
      'paid',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
      'quote_sent',
      'quote_accepted',
      'quote_rejected'
    ],
    default: 'pending_payment'
  },
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['stripe', 'mpesa', 'bank_transfer', 'cash_on_delivery', 'quote'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    stripePaymentIntentId: String,
    mpesaTransactionId: String,
    paidAt: Date,
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  // Shipping Information
  shipping: {
    method: {
      type: String,
      enum: ['standard', 'express', 'pickup', 'special_delivery'],
      default: 'standard'
    },
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    trackingNumber: String,
    carrier: String,
    shippingNotes: String
  },
  // Quote Information (for RFQ orders)
  quote: {
    isQuoteRequest: {
      type: Boolean,
      default: false
    },
    quoteSentAt: Date,
    quoteValidUntil: Date,
    quoteNotes: String,
    quoteDocument: {
      url: String,
      filename: String
    },
    salesRepresentative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Order Notes and Communication
  notes: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isCustomerVisible: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Status History
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String
  }],
  // Additional Fields
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  cancellationReason: String,
  refundAmount: Number,
  refundReason: String,
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  tags: [String],
  // Analytics
  source: {
    type: String,
    enum: ['website', 'mobile_app', 'phone', 'email', 'admin'],
    default: 'website'
  },
  // Bulk order specific fields
  bulkOrderInfo: {
    isBulkOrder: {
      type: Boolean,
      default: false
    },
    institutionType: {
      type: String,
      enum: ['hospital', 'clinic', 'dental_clinic', 'laboratory', 'ngo', 'government'],
    },
    approvalRequired: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    projectReference: String,
    budgetCode: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'payment.method': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ expectedDeliveryDate: 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Find the last order of the day
    const todayStart = new Date(date.setHours(0, 0, 0, 0));
    const todayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    const lastOrder = await this.constructor
      .findOne({
        createdAt: { $gte: todayStart, $lte: todayEnd }
      })
      .sort({ createdAt: -1 });
    
    let sequence = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.orderNumber = `MEK${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

// Method to add status to history
orderSchema.methods.addStatusHistory = function(status, changedBy, note) {
  this.statusHistory.push({
    status,
    changedBy,
    note,
    changedAt: new Date()
  });
  
  this.status = status;
  return this.save();
};

// Method to add order note
orderSchema.methods.addNote = function(authorId, message, isCustomerVisible = false) {
  this.notes.push({
    author: authorId,
    message,
    isCustomerVisible,
    createdAt: new Date()
  });
  
  return this.save();
};

// Method to calculate totals
orderSchema.methods.calculateTotals = function() {
  this.pricing.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  if (this.pricing.vatRate > 0) {
    this.pricing.vatAmount = (this.pricing.subtotal * this.pricing.vatRate) / 100;
  }
  
  this.pricing.totalAmount = this.pricing.subtotal + 
                            this.pricing.vatAmount + 
                            this.pricing.shippingCost - 
                            this.pricing.discountAmount;
  
  return this;
};

// Method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  const cancellableStatuses = ['pending_payment', 'paid', 'confirmed'];
  return cancellableStatuses.includes(this.status);
};

// Method to check if order is paid
orderSchema.methods.isPaid = function() {
  return this.payment.status === 'completed';
};

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = function(status, options = {}) {
  return this.find({ status })
    .populate('customer', 'firstName lastName email organizationName')
    .populate('items.product', 'name images pricing')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 50);
};

// Static method for dashboard statistics
orderSchema.statics.getDashboardStats = async function(dateRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);
  
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        paidOrders: {
          $sum: {
            $cond: [{ $eq: ['$payment.status', 'completed'] }, 1, 0]
          }
        },
        pendingOrders: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending_payment'] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    paidOrders: 0,
    pendingOrders: 0
  };
};

// Virtual for order age in days
orderSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for formatted order number
orderSchema.virtual('formattedOrderNumber').get(function() {
  return `#${this.orderNumber}`;
});

module.exports = mongoose.model('Order', orderSchema);