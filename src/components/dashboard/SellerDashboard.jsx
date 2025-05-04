import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getSellerInvoices } from '../../utils/api';
import {
  ClipboardDocumentCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon as ExclamationIcon,
  DocumentPlusIcon,
  CurrencyDollarIcon as CashIcon,
  PlusCircleIcon,
  ArrowLongRightIcon,
} from '@heroicons/react/24/outline';

const statusColorMap = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  correction_requested: 'bg-red-100 text-red-800',
  paid: 'bg-blue-100 text-blue-800',
};

const SellerDashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await getSellerInvoices();
        setInvoices(response.data);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Failed to fetch invoices. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // Memoize dashboard statistics
  const {
    totalInvoices,
    pendingInvoices,
    approvedInvoices,
    correctionRequests,
    totalAmount,
    recentInvoices
  } = useMemo(() => {
    return {
      totalInvoices: invoices.length,
      pendingInvoices: invoices.filter(invoice => invoice.status === 'sent').length,
      approvedInvoices: invoices.filter(invoice => invoice.status === 'approved').length,
      correctionRequests: invoices.filter(invoice => invoice.status === 'correction_requested').length,
      totalAmount: invoices.reduce((sum, invoice) => sum + invoice.total, 0),
      recentInvoices: [...invoices]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    };
  }, [invoices]);

  // Function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your invoices and track payments
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              to="/seller/invoices/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Create New Invoice
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentPlusIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Invoices</dt>
                    <dd className="mt-1">
                      <div className="text-2xl font-semibold text-gray-900">{totalInvoices}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-2">
              <div className="text-sm text-gray-500">
                All time total
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Approval</dt>
                    <dd className="mt-1">
                      <div className="text-2xl font-semibold text-gray-900">{pendingInvoices}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-2">
              <div className="text-sm text-yellow-600">
                Awaiting buyer review
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentCheckIcon className="h-8 w-8 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                    <dd className="mt-1">
                      <div className="text-2xl font-semibold text-gray-900">{approvedInvoices}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-2">
              <div className="text-sm text-green-600">
                Ready for payment
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CashIcon className="h-8 w-8 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Amount</dt>
                    <dd className="mt-1">
                      <div className="text-2xl font-semibold text-gray-900">{formatCurrency(totalAmount)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-2">
              <div className="text-sm text-blue-600">
                Total value
              </div>
            </div>
          </div>
        </div>

        {/* Correction Requests Alert */}
        {correctionRequests > 0 && (
          <div className="mt-8">
            <div className="rounded-lg bg-white shadow-sm p-6 border-l-4 border-red-400">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Action Required: {correctionRequests} invoice{correctionRequests !== 1 ? 's' : ''} need{correctionRequests === 1 ? 's' : ''} correction
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>Review and update the requested changes to proceed with these invoices.</p>
                  </div>
                  <div className="mt-4">
                    <Link
                      to="/seller/invoices"
                      className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-500 transition-colors duration-200"
                    >
                      View and update
                      <ArrowLongRightIcon className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Invoices */}
        <div className="mt-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Invoices</h3>
            {invoices.length > 5 && (
              <Link 
                to="/seller/invoices" 
                className="hidden sm:flex sm:items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                View all
                <ArrowLongRightIcon className="ml-1 h-4 w-4" />
              </Link>
            )}
          </div>
          <div className="mt-4 -mx-4 sm:mx-0">
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Invoice #
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">
                      Buyer
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">
                      Due Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentInvoices.length > 0 ? (
                    recentInvoices.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">
                          {invoice.buyer.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">
                          {formatCurrency(invoice.total)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[invoice.status]}`}>
                            {invoice.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link 
                            to={`/seller/invoices/${invoice._id}`} 
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 bg-gray-50">
                        <div className="inline-flex items-center space-x-2">
                          <DocumentPlusIcon className="h-5 w-5" />
                          <span>No invoices yet. Create your first invoice to get started!</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {invoices.length > 5 && (
            <div className="mt-4 sm:hidden">
              <Link 
                to="/seller/invoices" 
                className="flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                View all invoices
                <ArrowLongRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;