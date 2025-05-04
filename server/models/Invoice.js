import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true  // Allow null/undefined values while maintaining uniqueness
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'approved', 'correction_requested', 'paid'],
    default: 'sent'
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true
    }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  notes: String,
  dueDate: {
    type: Date,
    required: true
  },
  correctionNotes: String
}, {
  timestamps: true
});

// Generate invoice number before saving
invoiceSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.invoiceNumber) {
      const lastInvoice = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
      const lastNumber = lastInvoice?.invoiceNumber ? parseInt(lastInvoice.invoiceNumber.split('-')[1], 10) : 0;
      const nextNumber = (lastNumber || 0) + 1;
      this.invoiceNumber = `INV-${String(nextNumber).padStart(6, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;