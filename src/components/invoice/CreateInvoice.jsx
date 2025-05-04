import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInvoice, getAllBuyers } from '../../utils/api';
import {
  PlusCircleIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Calculate default due date (3 days from today)
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 3);

  const [formData, setFormData] = useState({
    buyer: '',
    dueDate: defaultDueDate.toISOString().split('T')[0],
    items: [
      {
        name: '',
        description: '',
        quantity: 1,
        price: 0,
        total: 0
      }
    ],
    notes: '',
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0
  });

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const response = await getAllBuyers();
        // Set buyers directly from response.data since that's how the server returns it
        setBuyers(response.data || []);
      } catch (error) {
        setError('Failed to fetch buyers');
        console.error('Error fetching buyers:', error);
        setBuyers([]); // Set empty array on error to prevent mapping errors
      } finally {
        setLoading(false);
      }
    };

    fetchBuyers();
  }, []);

  // Calculate line item totals and invoice totals
  useEffect(() => {
    if (!formData.items?.length) return;

    // Calculate everything based on current items, tax, and discount
    const calculateTotals = () => {
      const updatedItems = formData.items.map(item => ({
        ...item,
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
        total: Number((Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2))
      }));

      const subtotal = Number(updatedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2));
      const tax = Number(Number(formData.tax || 0).toFixed(2));
      const discount = Number(Number(formData.discount || 0).toFixed(2));
      const total = Number((subtotal + tax - discount).toFixed(2));

      return { updatedItems, subtotal, tax, discount, total };
    };

    const { updatedItems, subtotal, tax, discount, total } = calculateTotals();

    // Only update state if values have actually changed
    if (
      JSON.stringify(updatedItems) !== JSON.stringify(formData.items) ||
      subtotal !== formData.subtotal ||
      total !== formData.total
    ) {
      setFormData(prevState => ({
        ...prevState,
        items: updatedItems,
        subtotal,
        tax,
        discount,
        total
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [formData.items, formData.tax, formData.discount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [name]: name === 'quantity' || name === 'price' ? parseFloat(value) || 0 : value };
    setFormData({ ...formData, items: updatedItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', description: '', quantity: 1, price: 0, total: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      return; // Prevent removing the last item
    }
    
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData({ ...formData, items: updatedItems });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    // Validate required fields
    if (!formData.buyer || !formData.dueDate) {
      setError('Please fill in all required fields');
      setSubmitting(false);
      return;
    }

    // Validate items
    if (!formData.items.every(item => item.name && item.quantity > 0)) {
      setError('Please fill in all item details with valid quantities');
      setSubmitting(false);
      return;
    }

    try {
      // Format the data according to server expectations
      const invoiceData = {
        buyer: formData.buyer,
        dueDate: formData.dueDate,
        notes: formData.notes || '',
        tax: Number(Number(formData.tax || 0).toFixed(2)),
        discount: Number(Number(formData.discount || 0).toFixed(2)),
        items: formData.items.map(item => ({
          name: item.name.trim(),
          description: (item.description || '').trim(),
          quantity: Number(item.quantity),
          price: Number(Number(item.price).toFixed(2)),
          total: Number((Number(item.quantity) * Number(item.price)).toFixed(2))
        })),
        subtotal: Number(formData.subtotal.toFixed(2)),
        total: Number(formData.total.toFixed(2))
      };

      await createInvoice(invoiceData);
      setSuccess(true);
      
      // Reset form data with default due date
      const resetDueDate = new Date();
      resetDueDate.setDate(resetDueDate.getDate() + 3);

      setFormData({
        buyer: '',
        dueDate: resetDueDate.toISOString().split('T')[0],
        items: [
          {
            name: '',
            description: '',
            quantity: 1,
            price: 0,
            total: 0
          }
        ],
        notes: '',
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0
      });

      // Navigate to dashboard after showing success message
      setTimeout(() => {
        navigate('/seller/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error creating invoice:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to create invoice';
      setError(`Error: ${errorMessage}`);
      if (error.response?.data?.details) {
        console.error('Validation details:', error.response.data.details);
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Create Invoice</h1>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">Invoice created successfully! Redirecting...</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* Buyer and Due Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="buyer" className="block text-sm font-medium text-gray-700">
              Buyer *
            </label>
            <select
              id="buyer"
              name="buyer"
              required
              value={formData.buyer}
              onChange={handleChange}
              className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select a buyer</option>
              {buyers.map((buyer) => (
                <option key={buyer._id} value={buyer._id}>
                  {buyer.name}
                </option>
              ))}
            </select>
            {buyers.length === 0 && (
              <p className="mt-2 text-sm text-red-600">
                No buyers available. Buyers need to complete KYC verification before you can create invoices for them.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
              Due Date *
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              required
              value={formData.dueDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircleIcon className="-ml-0.5 mr-2 h-4 w-4" />
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
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
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        name="name"
                        required
                        value={item.name}
                        onChange={(e) => handleItemChange(index, e)}
                        placeholder="Item name"
                        className="block w-full border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        name="description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, e)}
                        placeholder="Description"
                        className="block w-full border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, e)}
                        className="block w-20 border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-1">$</span>
                        <input
                          type="number"
                          name="price"
                          min="0"
                          step="0.01"
                          required
                          value={item.price}
                          onChange={(e) => handleItemChange(index, e)}
                          className="block w-24 border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      ${formatCurrency(item.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1}
                        className={`text-red-600 hover:text-red-900 ${formData.items.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <TrashIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
          <div className="sm:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Additional notes or payment instructions"
            />
          </div>

          <div className="sm:col-span-1 sm:col-start-2">
            <dl className="space-y-2">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Subtotal</dt>
                <dd className="text-sm font-medium text-gray-900">${formatCurrency(formData.subtotal)}</dd>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                <dt className="flex items-center text-sm text-gray-600">
                  <span>Tax</span>
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-1">$</span>
                    <input
                      type="number"
                      name="tax"
                      min="0"
                      step="0.01"
                      value={formData.tax}
                      onChange={handleChange}
                      className="block w-20 border-0 p-0 text-right text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                    />
                  </div>
                </dd>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                <dt className="flex items-center text-sm text-gray-600">
                  <span>Discount</span>
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-1">$</span>
                    <input
                      type="number"
                      name="discount"
                      min="0"
                      step="0.01"
                      value={formData.discount}
                      onChange={handleChange}
                      className="block w-20 border-0 p-0 text-right text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                    />
                  </div>
                </dd>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                <dt className="text-base font-medium text-gray-900">Total</dt>
                <dd className="text-base font-medium text-gray-900">${formatCurrency(formData.total)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-5 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/seller/invoices')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || buyers.length === 0}
              className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                (submitting || buyers.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoice;