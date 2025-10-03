import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { clientsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Clients = () => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch clients
  const { data: clientsData, isLoading, refetch } = useQuery(
    ['clients', { search, status: statusFilter, page: currentPage }],
    () => clientsAPI.getClients({
      search,
      status: statusFilter,
      page: currentPage,
      limit: 10
    }),
    {
      select: (response) => response.data
    }
  );

  const handleDelete = async (clientId, clientName) => {
    if (window.confirm(`هل أنت متأكد من حذف العميل "${clientName}"؟`)) {
      try {
        console.log('🗑️ DELETING CLIENT:', clientId);
        await clientsAPI.deleteClient(clientId);
        
        // INVALIDATE CACHE TO REFRESH UI IMMEDIATELY
        console.log('🔄 INVALIDATING CLIENT CACHE...');
        await queryClient.invalidateQueries(['clients']);
        await queryClient.invalidateQueries(['dashboard']);
        console.log('✅ CLIENT CACHE INVALIDATED');
        
        toast.success('تم حذف العميل بنجاح');
        refetch(); // Also keep the original refetch as backup
      } catch (error) {
        console.error('❌ CLIENT DELETE ERROR:', error);
        toast.error(error.response?.data?.message || 'حدث خطأ في الحذف');
      }
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'gray',
      potential: 'warning',
      lost: 'error'
    };
    
    const labels = {
      active: 'نشط',
      inactive: 'غير نشط',
      potential: 'محتمل',
      lost: 'مفقود'
    };

    return (
      <Badge variant={variants[status] || 'gray'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            العملاء
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            إدارة علاقات العملاء
          </p>
        </div>
        {hasPermission('create_clients') && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link to="/clients/new">
              <Button icon={PlusIcon}>
                إضافة عميل
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في العملاء..."
                className="input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div>
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
                <option value="potential">محتمل</option>
                <option value="lost">مفقود</option>
              </select>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setCurrentPage(1);
                }}
              >
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="card">
        <div className="overflow-x-auto">
          {clientsData?.data?.length > 0 ? (
            <>
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell" style={{width: '25%'}}>العميل</th>
                    <th className="table-header-cell" style={{width: '20%'}}>الشركة</th>
                    <th className="table-header-cell" style={{width: '20%'}}>البريد الإلكتروني</th>
                    <th className="table-header-cell" style={{width: '15%'}}>الهاتف</th>
                    <th className="table-header-cell" style={{width: '10%'}}>الحالة</th>
                    <th className="table-header-cell" style={{width: '10%'}}>القيمة</th>
                    <th className="table-header-cell table-actions" style={{width: '200px', minWidth: '200px'}}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {clientsData.data.map((client) => (
                    <tr key={client._id} className="hover:bg-gray-50">
                      <td className="table-cell-content">
                        <div className="flex items-center min-w-0">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-medium text-sm">
                                {client.firstName[0]}{client.lastName[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 min-w-0 flex-1">
                            <Link to={`/clients/${client._id}`}>
                              <div className="text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer truncate" title={`${client.firstName} ${client.lastName}`}>
                                {client.firstName} {client.lastName}
                              </div>
                            </Link>
                            <div className="text-sm text-gray-500 truncate" title={client.jobTitle}>
                              {client.jobTitle}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900 truncate" title={client.companyName}>{client.companyName}</div>
                        <div className="text-sm text-gray-500 truncate" title={client.industry}>{client.industry}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900 truncate" title={client.email}>{client.email}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900 truncate" title={client.phone}>{client.phone}</div>
                      </td>
                      <td className="table-cell">
                        {getStatusBadge(client.status)}
                      </td>
                      <td className="table-cell">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(client.value, client.currency)}
                        </div>
                      </td>
                      <td className="table-actions">
                        <div className="flex items-center justify-start gap-1" style={{display: 'flex', gap: '4px'}}>
                          <Link to={`/clients/${client._id}`}>
                            <button 
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <EyeIcon style={{width: '12px', height: '12px'}} />
                              عرض
                            </button>
                          </Link>
                          {hasPermission('update_clients') && (
                            <Link to={`/clients/${client._id}/edit`}>
                              <button 
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: '#22c55e',
                                  color: 'white',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <PencilIcon style={{width: '12px', height: '12px'}} />
                                تعديل
                              </button>
                            </Link>
                          )}
                          {hasPermission('delete_clients') && (
                            <button
                              onClick={() => handleDelete(client._id, `${client.firstName} ${client.lastName}`)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <TrashIcon style={{width: '12px', height: '12px'}} />
                              حذف
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {clientsData.pagination && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={!clientsData.pagination.prev}
                    >
                      السابق
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!clientsData.pagination.next}
                    >
                      التالي
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        عرض <span className="font-medium">{clientsData.count}</span> من{' '}
                        <span className="font-medium">{clientsData.total}</span> عميل
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={!clientsData.pagination.prev}
                          className="rounded-r-md"
                        >
                          السابق
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={!clientsData.pagination.next}
                          className="rounded-l-md"
                        >
                          التالي
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد عملاء</h3>
              <p className="mt-1 text-sm text-gray-500">
                ابدأ بإضافة عميل جديد لإدارة علاقات العملاء
              </p>
              {hasPermission('create_clients') && (
                <div className="mt-6">
                  <Link to="/clients/new">
                    <Button icon={PlusIcon}>
                      إضافة عميل جديد
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clients;
