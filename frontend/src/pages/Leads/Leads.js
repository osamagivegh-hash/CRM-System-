import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { leadsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Leads = () => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch leads
  const { data: leadsData, isLoading, refetch } = useQuery(
    ['leads', { search, status: statusFilter, priority: priorityFilter, page: currentPage }],
    () => leadsAPI.getLeads({
      search,
      status: statusFilter,
      priority: priorityFilter,
      page: currentPage,
      limit: 10
    }),
    {
      select: (response) => response.data
    }
  );

  const handleDelete = async (leadId, leadName) => {
    if (window.confirm(`هل أنت متأكد من حذف العميل المحتمل "${leadName}"؟`)) {
      try {
        console.log('🗑️ DELETING LEAD:', leadId);
        await leadsAPI.deleteLead(leadId);
        
        // INVALIDATE CACHE TO REFRESH UI IMMEDIATELY
        console.log('🔄 INVALIDATING LEAD CACHE...');
        await queryClient.invalidateQueries(['leads']);
        await queryClient.invalidateQueries(['dashboard']);
        console.log('✅ LEAD CACHE INVALIDATED');
        
        toast.success('تم حذف العميل المحتمل بنجاح');
        refetch(); // Keep original refetch as backup
      } catch (error) {
        console.error('❌ LEAD DELETE ERROR:', error);
        toast.error(error.response?.data?.message || 'حدث خطأ في الحذف');
      }
    }
  };

  const handleConvertToClient = async (leadId, leadName) => {
    if (window.confirm(`هل تريد تحويل "${leadName}" إلى عميل؟`)) {
      try {
        console.log('🔄 CONVERTING LEAD TO CLIENT:', leadId);
        await leadsAPI.convertToClient(leadId);
        
        // INVALIDATE MULTIPLE CACHES SINCE THIS AFFECTS BOTH LEADS AND CLIENTS
        console.log('🔄 INVALIDATING CACHES FOR LEAD CONVERSION...');
        await queryClient.invalidateQueries(['leads']);
        await queryClient.invalidateQueries(['clients']);
        await queryClient.invalidateQueries(['dashboard']);
        console.log('✅ ALL CACHES INVALIDATED');
        
        toast.success('تم تحويل العميل المحتمل إلى عميل بنجاح');
        refetch(); // Keep original refetch as backup
      } catch (error) {
        console.error('❌ LEAD CONVERSION ERROR:', error);
        toast.error(error.response?.data?.message || 'حدث خطأ في التحويل');
      }
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      new: 'info',
      contacted: 'warning',
      qualified: 'primary',
      proposal: 'warning',
      negotiation: 'info',
      closed_won: 'success',
      closed_lost: 'error'
    };
    
    const labels = {
      new: 'جديد',
      contacted: 'تم التواصل',
      qualified: 'مؤهل',
      proposal: 'عرض مقدم',
      negotiation: 'تفاوض',
      closed_won: 'تم الإغلاق - نجح',
      closed_lost: 'تم الإغلاق - فشل'
    };

    return (
      <Badge variant={variants[status] || 'gray'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: 'gray',
      medium: 'warning',
      high: 'error',
      urgent: 'error'
    };
    
    const labels = {
      low: 'منخفضة',
      medium: 'متوسطة',
      high: 'عالية',
      urgent: 'عاجلة'
    };

    return (
      <Badge variant={variants[priority] || 'gray'}>
        {labels[priority] || priority}
      </Badge>
    );
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-SA');
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
            العملاء المحتملين
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            تتبع وإدارة العملاء المحتملين
          </p>
        </div>
        {hasPermission('create_leads') && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link to="/leads/new">
              <Button icon={PlusIcon}>
                إضافة عميل محتمل
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في العملاء المحتملين..."
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
                <option value="new">جديد</option>
                <option value="contacted">تم التواصل</option>
                <option value="qualified">مؤهل</option>
                <option value="proposal">عرض مقدم</option>
                <option value="negotiation">تفاوض</option>
                <option value="closed_won">تم الإغلاق - نجح</option>
                <option value="closed_lost">تم الإغلاق - فشل</option>
              </select>
            </div>

            <div>
              <select
                className="input"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">جميع الأولويات</option>
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="urgent">عاجلة</option>
              </select>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPriorityFilter('');
                  setCurrentPage(1);
                }}
              >
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card">
        <div className="overflow-x-auto">
          {leadsData?.data?.length > 0 ? (
            <>
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell" style={{width: '20%'}}>العميل المحتمل</th>
                    <th className="table-header-cell" style={{width: '15%'}}>الشركة</th>
                    <th className="table-header-cell" style={{width: '10%'}}>الحالة</th>
                    <th className="table-header-cell" style={{width: '10%'}}>الأولوية</th>
                    <th className="table-header-cell" style={{width: '15%'}}>القيمة المتوقعة</th>
                    <th className="table-header-cell" style={{width: '10%'}}>الاحتمالية</th>
                    <th className="table-header-cell" style={{width: '15%'}}>تاريخ الإغلاق</th>
                    <th className="table-header-cell table-actions" style={{width: '200px', minWidth: '200px'}}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {leadsData.data.map((lead) => (
                    <tr key={lead._id} className="hover:bg-gray-50">
                      <td className="table-cell-content">
                        <div className="flex items-center min-w-0">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-medium text-sm">
                                {lead.firstName[0]}{lead.lastName[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 min-w-0 flex-1">
                            <Link to={`/leads/${lead._id}`}>
                              <div className="text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer truncate" title={`${lead.firstName} ${lead.lastName}`}>
                                {lead.firstName} {lead.lastName}
                              </div>
                            </Link>
                            <div className="text-sm text-gray-500 truncate" title={lead.email}>
                              {lead.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900 truncate" title={lead.companyName}>{lead.companyName}</div>
                        <div className="text-sm text-gray-500 truncate" title={lead.jobTitle}>{lead.jobTitle}</div>
                      </td>
                      <td className="table-cell">
                        {getStatusBadge(lead.status)}
                      </td>
                      <td className="table-cell">
                        {getPriorityBadge(lead.priority)}
                      </td>
                      <td className="table-cell">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {formatCurrency(lead.estimatedValue, lead.currency)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">{lead.probability}%</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900 truncate">
                          {formatDate(lead.expectedCloseDate)}
                        </div>
                      </td>
                      <td className="table-actions">
                        <div className="flex items-center justify-start gap-1" style={{display: 'flex', gap: '4px'}}>
                          <Link to={`/leads/${lead._id}`}>
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
                          {hasPermission('update_leads') && (
                            <Link to={`/leads/${lead._id}/edit`}>
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
                          {hasPermission('create_clients') && !lead.convertedToClient && (
                            <button
                              onClick={() => handleConvertToClient(lead._id, `${lead.firstName} ${lead.lastName}`)}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: '#f97316',
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
                              <ArrowPathIcon style={{width: '12px', height: '12px'}} />
                              تحويل
                            </button>
                          )}
                          {hasPermission('delete_leads') && (
                            <button
                              onClick={() => handleDelete(lead._id, `${lead.firstName} ${lead.lastName}`)}
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
              {leadsData.pagination && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={!leadsData.pagination.prev}
                    >
                      السابق
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!leadsData.pagination.next}
                    >
                      التالي
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        عرض <span className="font-medium">{leadsData.count}</span> من{' '}
                        <span className="font-medium">{leadsData.total}</span> عميل محتمل
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={!leadsData.pagination.prev}
                          className="rounded-r-md"
                        >
                          السابق
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={!leadsData.pagination.next}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد عملاء محتملين</h3>
              <p className="mt-1 text-sm text-gray-500">
                ابدأ بإضافة عميل محتمل جديد لتتبع مبيعاتك
              </p>
              {hasPermission('create_leads') && (
                <div className="mt-6">
                  <Link to="/leads/new">
                    <Button icon={PlusIcon}>
                      إضافة عميل محتمل جديد
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

export default Leads;
