import express from 'express';
import { protect, isSeller, isBuyer } from '../middleware/auth.js';
import {
  createInvoice,
  getSellerInvoices,
  getBuyerInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  getSellerBuyers,
  updateInvoice,
  getInvoicePdf
} from '../controllers/invoiceController.js';

const router = express.Router();

router.post('/', protect, isSeller, createInvoice);
router.put('/:id', protect, isSeller, updateInvoice);
router.get('/seller', protect, isSeller, getSellerInvoices);
router.get('/buyer', protect, isBuyer, getBuyerInvoices);
router.get('/buyers', protect, isSeller, getSellerBuyers);
router.get('/:id', protect, getInvoiceById);
router.get('/:id/pdf', protect, getInvoicePdf);
router.put('/:id/status', protect, updateInvoiceStatus);

router.get('/download/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('seller')
      .populate('buyer')
      .populate('items');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);

    // Generate and stream the PDF
    await generatePDF(invoice, res);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
});

export default router;