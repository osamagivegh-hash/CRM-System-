import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { companiesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Companies = () => {
  const { isSuperAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch companies
  const { data: companiesData, isLoading, refetch } = useQuery(
    ['companies', { search, isActive: statusFilter, page: currentPage }],
    () => companiesAPI.getCompanies({
      search,
      isActive: statusFilter,
      page: currentPage,
      limit: 10
    }),
    {
      select: (response) => response.data,
      enabled: isSuperAdmin()
    }
  );

  const handleDelete = async (companyId, companyName) => {
    if (window.confirm(`هل أنت متأكد من حذف الشركة "${companyName}"؟ سيتم حذف جميع البيانات المرتبطة بها.`)) {
      try {
        await companiesAPI.deleteCompany(companyId);
        toast.success('تم حذف الشركة بنجاح');
        refetch();
      } catch (error) {
        toast.error(error.response?.data?.message || 'حدث خطأ في الحذف');
      }
    }
  };

  const getPlanBadge = (plan) => {
    const variants = {
      starter: 'gray',
      professional: 'warning',
      enterprise: 'primary'
    };
    
    const labels = {
      starter: 'مبتدئ',
      professional: 'احترافي',
      enterprise: 'مؤسسي'
    };

    return (
      <Badge variant={variants[plan] || 'gray'}>
        {labels[plan] || plan}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Removed unused formatDate function

  if (!isSuperAdmin()) {
    return (
      <div className="text-center py-12">
        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">غير مصرح</h3>
        <p className="mt-1 text-sm text-gray-500">
          هذه الصفحة متاحة فقط لمديري النظام
        </p>
      </div>
    );
  }

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
            الشركات
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            إدارة الشركات في النظام
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link to="/companies/new">
            <Button icon={PlusIcon}>
              إضافة شركة
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في الشركات..."
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
                <option value="true">نشطة</option>
                <option value="false">غير نشطة</option>
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

      {/* Companies Table */}
      <div className="card">
        <div className="overflow-hidden">
          {companiesData?.data?.length > 0 ? (
            <>
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">الشركة</th>
                    <th className="table-header-cell">البريد الإلكتروني</th>
                    <th className="table-header-cell">الخطة</th>
                    <th className="table-header-cell">المستخدمين</th>
                    <th className="table-header-cell">السعر الشهري</th>
                    <th className="table-header-cell">الحالة</th>
                    <th className="table-header-cell">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {companiesData.data.map((company) => (
                    <tr key={company._id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <Link to={`/companies/${company._id}`}>
                              <div className="text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer">
                                {company.name}
                              </div>
                            </Link>
                            <div className="text-sm text-gray-500">
                              {company.industry}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">{company.email}</div>
                        <div className="text-sm text-gray-500">{company.phone}</div>
                      </td>
                      <td className="table-cell">
                        {getPlanBadge(company.plan)}
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">
                          {company.currentUsers} / {company.maxUsers}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(company.monthlyPrice)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          {company.isActive ? (
                            <Badge variant="success">نشطة</Badge>
                          ) : (
                            <Badge variant="gray">غير نشطة</Badge>
                          )}
                        </div>
                      </td>
                      <td className="table-actions">
                        <div className="flex items-center justify-start space-x-1 rtl:space-x-reverse">
                          <Link to={`/companies/${company._id}`}>
                            <button 
                              className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                              title="عرض التفاصيل"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </Link>
                          <Link to={`/companies/${company._id}/edit`}>
                            <button 
                              className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                              title="تعديل"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(company._id, company.name)}
                            className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="حذف"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {companiesData.pagination && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={!companiesData.pagination.prev}
                    >
                      السابق
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!companiesData.pagination.next}
                    >
                      التالي
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        عرض <span className="font-medium">{companiesData.count}</span> من{' '}
                        <span className="font-medium">{companiesData.total}</span> شركة
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={!companiesData.pagination.prev}
                          className="rounded-r-md"
                        >
                          السابق
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={!companiesData.pagination.next}
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
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد شركات</h3>
              <p className="mt-1 text-sm text-gray-500">
                ابدأ بإضافة شركة جديدة للنظام
              </p>
              <div className="mt-6">
                <Link to="/companies/new">
                  <Button icon={PlusIcon}>
                    إضافة شركة جديدة
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Companies;
