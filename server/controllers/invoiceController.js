import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import PDFDocument from 'pdfkit';

// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Private/Seller
export const createInvoice = async (req, res) => {
  try {
    const { buyer, items, notes, dueDate, tax = 0, discount = 0 } = req.body;

    // Enhanced validation with detailed error messages
    if (!buyer) {
      return res.status(400).json({ message: 'Buyer is required' });
    }
    if (!dueDate) {
      return res.status(400).json({ message: 'Due date is required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    // Validate each item and calculate totals with precision
    const itemsWithTotal = items.map((item, index) => {
      if (!item.name || !item.name.trim()) {
        throw new Error(`Item ${index + 1} is missing a name`);
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        throw new Error(`Item ${index + 1} has an invalid quantity`);
      }
      if (typeof item.price !== 'number' || item.price < 0) {
        throw new Error(`Item ${index + 1} has an invalid price`);
      }

      const quantity = Number(item.quantity);
      const price = Number(item.price);
      const total = Number((quantity * price).toFixed(2));

      return {
        name: item.name.trim(),
        description: (item.description || '').trim(),
        quantity,
        price,
        total
      };
    });

    // Calculate invoice totals with precision
    const subtotal = Number(itemsWithTotal.reduce((sum, item) => sum + item.total, 0).toFixed(2));
    const totalTax = Number(Number(tax).toFixed(2));
    const totalDiscount = Number(Number(discount).toFixed(2));
    
    if (totalDiscount > subtotal) {
      return res.status(400).json({ message: 'Discount cannot be greater than subtotal' });
    }

    const total = Number((subtotal + totalTax - totalDiscount).toFixed(2));

    // Verify buyer exists and has completed KYC
    const buyerUser = await User.findById(buyer);
    if (!buyerUser) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    if (!buyerUser.kycCompleted) {
      return res.status(400).json({ message: 'Buyer has not completed KYC verification' });
    }

    // Create the invoice without explicitly setting invoiceNumber
    const invoice = await Invoice.create({
      seller: req.user._id,
      buyer,
      items: itemsWithTotal,
      subtotal,
      tax: totalTax,
      discount: totalDiscount,
      total,
      notes: notes || '',
      dueDate: new Date(dueDate),
      status: 'sent'  // Changed from 'draft' to 'sent'
    });

    // Populate buyer details for the response
    await invoice.populate('buyer', 'name email');

    res.status(201).json({ invoice });
  } catch (err) {
    console.error('Invoice creation error:', err);
    res.status(500).json({ 
      message: err.message || 'Server error while creating invoice', 
      details: err.errors || {}
    });
  }
};

// @desc    Get all invoices for a seller
// @route   GET /api/invoices/seller
// @access  Private/Seller
export const getSellerInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ seller: req.user._id })
      .populate('buyer', 'name email')
      .sort('-createdAt');
    res.json(invoices);
  } catch (err) {
    console.error('Get seller invoices error:', err.message);
    res.status(500).json({ message: 'Server error while fetching seller invoices' });
  }
};

// @desc    Get all invoices for a buyer
// @route   GET /api/invoices/buyer
// @access  Private/Buyer
export const getBuyerInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ buyer: req.user._id })
      .populate('seller', 'name email')
      .sort('-createdAt');
    res.json(invoices);
  } catch (err) {
    console.error('Get buyer invoices error:', err.message);
    res.status(500).json({ message: 'Server error while fetching buyer invoices' });
  }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('seller', 'name email kyc')
      .populate('buyer', 'name email kyc');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if user has permission to view this invoice
    if (invoice.seller._id.toString() !== req.user._id.toString() &&
        invoice.buyer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this invoice' });
    }

    res.json(invoice);
  } catch (err) {
    console.error('Get invoice by ID error:', err.message);
    res.status(500).json({ message: 'Server error while fetching invoice' });
  }
};

// @desc    Update invoice status
// @route   PUT /api/invoices/:id/status
// @access  Private
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { status, correctionNotes } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Buyers can only approve or request corrections
    if (req.user.role === 'buyer') {
      if (!['approved', 'correction_requested'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status update for buyer' });
      }
      if (invoice.buyer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this invoice' });
      }
    }

    // Sellers can only change status to sent or mark as paid
    if (req.user.role === 'seller') {
      if (!['sent', 'paid'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status update for seller' });
      }
      if (invoice.seller.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this invoice' });
      }
    }

    invoice.status = status;
    if (correctionNotes) {
      invoice.correctionNotes = correctionNotes;
    }

    await invoice.save();
    res.json(invoice);
  } catch (err) {
    console.error('Update invoice status error:', err.message);
    res.status(500).json({ message: 'Server error while updating invoice status' });
  }
};

// @desc    Update an invoice
// @route   PUT /api/invoices/:id
// @access  Private/Seller
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Verify seller owns this invoice
    if (invoice.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this invoice' });
    }

    // Only allow updates if invoice needs correction
    if (invoice.status !== 'correction_requested') {
      return res.status(400).json({ message: 'Can only update invoices that need correction' });
    }

    const {
      items,
      notes,
      tax = 0,
      discount = 0
    } = req.body;

    // Validate and calculate totals
    const itemsWithTotal = items.map(item => {
      const quantity = Number(item.quantity);
      const price = Number(item.price);
      const total = Number((quantity * price).toFixed(2));

      return {
        name: item.name.trim(),
        description: (item.description || '').trim(),
        quantity,
        price,
        total
      };
    });

    const subtotal = Number(itemsWithTotal.reduce((sum, item) => sum + item.total, 0).toFixed(2));
    const totalTax = Number(Number(tax).toFixed(2));
    const totalDiscount = Number(Number(discount).toFixed(2));
    
    if (totalDiscount > subtotal) {
      return res.status(400).json({ message: 'Discount cannot be greater than subtotal' });
    }

    const total = Number((subtotal + totalTax - totalDiscount).toFixed(2));

    // Update the invoice
    invoice.items = itemsWithTotal;
    invoice.notes = notes || '';
    invoice.tax = totalTax;
    invoice.discount = totalDiscount;
    invoice.subtotal = subtotal;
    invoice.total = total;
    invoice.status = 'sent';  // Reset status to sent after corrections
    invoice.correctionNotes = '';  // Clear correction notes

    await invoice.save();

    res.json(invoice);
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ 
      message: err.message || 'Server error while updating invoice',
      details: err.errors || {}
    });
  }
};

// @desc    Get all buyers for a seller
// @route   GET /api/invoices/buyers
// @access  Private/Seller
export const getSellerBuyers = async (req, res) => {
  try {
    const buyers = await User.find({ 
      role: 'buyer',
      kycCompleted: true 
    }).select('name email kyc');
    
    res.json(buyers);
  } catch (err) {
    console.error('Get seller buyers error:', err.message);
    res.status(500).json({ message: 'Server error while fetching buyers' });
  }
};

// @desc    Generate PDF for an invoice
export const getInvoicePdf = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('seller', 'name email kyc')
      .populate('buyer', 'name email kyc');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.seller._id.toString() !== req.user._id.toString() &&
        invoice.buyer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this invoice' });
    }

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);

    // Company header with address
    doc.fontSize(10)
       .text('Ellington Wood Decor,', 40, 40)
       .text('36 Terrick Rd, Ellington PE19 2NT, United Kingdom');

    // BILL TO section on left
    doc.text('BILL TO:', 40, 120)
       .text('Your client', 40, 135)
       .text('11 Beach Dr', 40, doc.y)
       .text('Ellington', 40, doc.y)
       .text('NE51 5EU', 40, doc.y)
       .text('United Kingdom', 40, doc.y);

    // Invoice details on right
    doc.text('Pro forma invoice No.:', 350, 120)
       .text('Issue date:', 350, doc.y)
       .text('Due date:', 350, doc.y);

    doc.text(invoice.invoiceNumber, 460, 120)
       .text(formatDate(invoice.createdAt), 460, doc.y - 27)
       .text(formatDate(invoice.dueDate), 460, doc.y - 14);

    // Items table
    doc.y = 220;
    const tableTop = doc.y;

    // Table headers
    doc.text('DESCRIPTION', 40, tableTop)
       .text('QUANTITY', 350, tableTop)
       .text('UNIT PRICE (£)', 420, tableTop)
       .text('AMOUNT (£)', 490, tableTop);

    // Table content
    let y = tableTop + 20;
    invoice.items.forEach(item => {
      // Main item name
      doc.text(item.name, 40, y);
      // Sub-description in gray
      if (item.description) {
        doc.fillColor('#666666')
           .text(item.description, 40, doc.y, { fontSize: 9 })
           .fillColor('#000000');
      }

      // Align numbers
      doc.text(item.quantity.toString(), 350, y)
         .text(item.price.toFixed(2), 420, y)
         .text(item.total.toFixed(2), 490, y);

      y = doc.y + 15;
    });

    // Totals section
    doc.y = y + 20;
    // TOTAL (GBP)
    doc.text('TOTAL (GBP):', 350, doc.y)
       .text(formatCurrency(invoice.total), 490, doc.y);

    doc.fillColor('#000000')
       .rect(350, doc.y + 5, 190, 0.5)
       .fill();

    // TOTAL DUE (GBP)
    doc.fillColor('#000000')
       .text('TOTAL DUE (GBP)', 350, doc.y + 10)
       .text(formatCurrency(invoice.total), 490, doc.y);

    // Signature
    doc.moveDown(3)
       .text('Issued by, signature', 40)
       .moveDown()
       .font('Helvetica-Oblique')
       .text('Ellington Wood Decor', 40);

    doc.end();
  } catch (err) {
    console.error('Generate invoice PDF error:', err.message);
    res.status(500).json({ message: 'Server error while generating PDF' });
  }
};

// Helper function to format currency (no symbol, just 2 decimal places)
const formatCurrency = (amount) => {
  return amount.toFixed(2);
};

// Helper function for date formatting
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// PDF generation function
const generatePDF = async (invoice, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Pipe the PDF to the response
  doc.pipe(res);

  // Add company logo (optional)
  // doc.image('path/to/logo.png', 50, 45, { width: 50 });

  // Document title
  doc.fontSize(20)
     .text('INVOICE', 50, 50, { align: 'right' });

  // Company info
  doc.fontSize(10)
     .text(invoice.seller.name, 50, 50)
     .text(invoice.seller.address || 'Company Address')
     .text(invoice.seller.email || '');

  // Invoice details
  doc.fontSize(10)
     .text(`Invoice Number: ${invoice.invoiceNumber}`, 50, doc.y + 20)
     .text(`Issue Date: ${formatDate(invoice.createdAt)}`)
     .text(`Due Date: ${formatDate(invoice.dueDate)}`);

  // Bill to section
  doc.moveDown()
     .fontSize(12)
     .text('Bill To:', 50, doc.y + 20)
     .fontSize(10)
     .text(invoice.buyer.name)
     .text(invoice.buyer.address || '')
     .text(invoice.buyer.email || '');

  // Items table
  doc.moveDown(2);
  const tableTop = doc.y;
  const tableHeaders = ['Item', 'Description', 'Qty', 'Price', 'Amount'];
  const columnWidths = [150, 170, 50, 70, 80];
  let currentX = 50;

  // Draw headers
  doc.fontSize(10);
  tableHeaders.forEach((header, i) => {
    doc.text(header, currentX, tableTop);
    currentX += columnWidths[i];
  });

  // Draw items
  let y = tableTop + 20;
  invoice.items.forEach(item => {
    currentX = 50;
    
    // Check if we need a new page
    if (y > doc.page.height - 150) {
      doc.addPage();
      y = 50;
    }

    doc.text(item.name, currentX, y);
    doc.text(item.description || '', currentX + columnWidths[0], y, { width: columnWidths[1] });
    doc.text(item.quantity.toString(), currentX + columnWidths[0] + columnWidths[1], y);
    doc.text(item.price.toFixed(2), currentX + columnWidths[0] + columnWidths[1] + columnWidths[2], y);
    doc.text(item.total.toFixed(2), currentX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], y);

    y = doc.y + 15;
  });

  // Summary section
  doc.moveDown(2);
  const summaryX = 400;
  doc.text('Subtotal:', summaryX, doc.y)
     .text(invoice.subtotal.toFixed(2), summaryX + 70, doc.y - 12, { align: 'right' });

  if (invoice.tax > 0) {
    doc.text('Tax:', summaryX, doc.y)
       .text(invoice.tax.toFixed(2), summaryX + 70, doc.y - 12, { align: 'right' });
  }

  if (invoice.discount > 0) {
    doc.text('Discount:', summaryX, doc.y)
       .text(`-${invoice.discount.toFixed(2)}`, summaryX + 70, doc.y - 12, { align: 'right' });
  }

  // Total
  doc.moveDown()
     .fontSize(12)
     .text('Total:', summaryX, doc.y)
     .text(invoice.total.toFixed(2), summaryX + 70, doc.y - 14, { align: 'right' });

  // Notes
  if (invoice.notes) {
    doc.moveDown(2)
       .fontSize(10)
       .text('Notes:', 50)
       .text(invoice.notes, 50, doc.y, { width: 500 });
  }

  // Footer
  doc.fontSize(8)
     .text('Thank you for your business', 50, doc.page.height - 50, { align: 'center' });

  doc.end();
};