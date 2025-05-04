import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoice, approveInvoice, requestCorrection, resendInvoice, getInvoicePdf } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowLongRightIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

const statusColorMap = {
  sent: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  correction_requested: 'bg-red-100 text-red-800',
  paid: 'bg-blue-100 text-blue-800',
};

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [correctionNote, setCorrectionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editableInvoice, setEditableInvoice] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await getInvoice(id);
        setInvoice(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch invoice');
        console.error('Error fetching invoice:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  useEffect(() => {
    if (invoice) {
      setEditableInvoice({
        items: invoice.items.map(item => ({ ...item })),
        notes: invoice.notes,
        tax: invoice.tax,
        discount: invoice.discount
      });
    }
  }, [invoice]);

  const handleApprove = async () => {
    try {
      setError('');
      setSubmitting(true);
      const response = await approveInvoice(id);
      setInvoice(response.data);
      
      // Show success for a moment before redirecting
      setTimeout(() => {
        navigate('/buyer/dashboard');
      }, 1000);
    } catch (err) {
      console.error('Error approving invoice:', err);
      setError(err.response?.data?.message || 'Failed to approve invoice. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestCorrection = async () => {
    if (!correctionNote.trim()) {
      setError('Please provide correction notes');
      return;
    }

    try {
      setSubmitting(true);
      await requestCorrection(id, { correctionNotes: correctionNote });
      // Refresh invoice data
      const response = await getInvoice(id);
      setInvoice(response.data);
      setCorrectionNote('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request correction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditItemChange = (index, field, value) => {
    const updatedItems = [...editableInvoice.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
      total: field === 'quantity' || field === 'price' 
        ? Number((Number(field === 'quantity' ? value : updatedItems[index].quantity) * 
                 Number(field === 'price' ? value : updatedItems[index].price)).toFixed(2))
        : updatedItems[index].total
    };
    
    const subtotal = Number(updatedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2));
    const total = Number((subtotal + Number(editableInvoice.tax) - Number(editableInvoice.discount)).toFixed(2));
    
    setEditableInvoice({
      ...editableInvoice,
      items: updatedItems,
      subtotal,
      total
    });
  };

  const handleUpdateInvoice = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await resendInvoice(invoice._id, editableInvoice);
      setInvoice(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setPrinting(true);
      setExportError('');
      setExportSuccess(false);
      
      const response = await getInvoicePdf(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      setExportError(err.response?.data?.message || 'Failed to export invoice to PDF');
    } finally {
      setPrinting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invoice found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Invoice #{invoice.invoiceNumber}
          </h2>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              Created on {formatDate(invoice.createdAt)}
            </div>
            <div className="mt-2 flex items-center">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[invoice.status]}`}>
                {invoice.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={printing}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
              printing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            <DocumentArrowDownIcon className="-ml-1 mr-2 h-5 w-5" />
            {printing ? 'Exporting...' : 'Export to PDF'}
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {exportSuccess && (
        <div className="mt-4">
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Invoice exported successfully
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {exportError && (
        <div className="mt-4">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {exportError}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details */}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice Details</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {user.role === 'buyer' ? 'Seller' : 'Buyer'}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user.role === 'buyer' ? invoice.seller.name : invoice.buyer.name}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Due Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(invoice.dueDate)}
              </dd>
            </div>
            {invoice.correctionNotes && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Correction Notes</dt>
                <dd className="mt-1 text-sm text-red-600 sm:mt-0 sm:col-span-2">
                  {invoice.correctionNotes}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Line Items */}
      <div className="mt-8">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-3">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Line Items</h3>
            </div>
            <div className="mt-5">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Subtotal</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(invoice.subtotal)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Tax</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(invoice.tax)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Discount</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(invoice.discount)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-700">Total</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(invoice.total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Seller Actions for Correction */}
      {user.role === 'seller' && invoice.status === 'correction_requested' && (
        <div className="mt-8 space-y-4">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Update Invoice
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p className="font-medium text-red-600">Correction Requested:</p>
                <p className="mt-1">{invoice.correctionNotes}</p>
              </div>
              <form onSubmit={handleUpdateInvoice}>
                <div className="mt-5">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {editableInvoice?.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleEditItemChange(index, 'name', e.target.value)}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleEditItemChange(index, 'description', e.target.value)}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleEditItemChange(index, 'quantity', e.target.value)}
                                className="block w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => handleEditItemChange(index, 'price', e.target.value)}
                                className="block w-24 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="tax" className="block text-sm font-medium text-gray-700">Tax</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        id="tax"
                        value={editableInvoice?.tax}
                        onChange={(e) => setEditableInvoice({
                          ...editableInvoice,
                          tax: Number(e.target.value),
                          total: Number((editableInvoice.subtotal + Number(e.target.value) - editableInvoice.discount).toFixed(2))
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="discount" className="block text-sm font-medium text-gray-700">Discount</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        id="discount"
                        value={editableInvoice?.discount}
                        onChange={(e) => setEditableInvoice({
                          ...editableInvoice,
                          discount: Number(e.target.value),
                          total: Number((editableInvoice.subtotal + editableInvoice.tax - Number(e.target.value)).toFixed(2))
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        id="notes"
                        value={editableInvoice?.notes}
                        onChange={(e) => setEditableInvoice({
                          ...editableInvoice,
                          notes: e.target.value
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {submitting ? 'Updating...' : 'Update and Resend Invoice'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Buyer Actions */}
      {user.role === 'buyer' && invoice.status === 'sent' && (
        <div className="mt-8 space-y-4">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Review Invoice
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Please review the invoice and either approve it or request corrections.</p>
              </div>
              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="correctionNote" className="block text-sm font-medium text-gray-700">
                    Correction Notes
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="correctionNote"
                      name="correctionNote"
                      rows={3}
                      value={correctionNote}
                      onChange={(e) => setCorrectionNote(e.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Explain what needs to be corrected..."
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={submitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckCircleIcon className="-ml-1 mr-2 h-5 w-5" />
                    Approve Invoice
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestCorrection}
                    disabled={submitting || !correctionNote.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <XCircleIcon className="-ml-1 mr-2 h-5 w-5" />
                    Request Correction
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetails;