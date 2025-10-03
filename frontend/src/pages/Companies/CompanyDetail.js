import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UsersIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { companiesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  // Fetch company data
  const { data: company, isLoading, error } = useQuery(
    ['company', id],
    () => companiesAPI.getCompany(id),
    {
      select: (response) => response.data.data
    }
  );

  // Get company stats
  const { data: stats } = useQuery(
    ['company-stats', id],
    () => companiesAPI.getCompanyStats(id),
    {
      select: (response) => response.data.data
    }
  );

  // Delete company mutation
  const deleteMutation = useMutation(
    () => companiesAPI.deleteCompany(id),
    {
      onSuccess: () => {
        toast.success('تم حذف الشركة بنجاح');
        navigate('/companies');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'حدث خطأ في الحذف');
      }
    }
  );

  const handleDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف الشركة "${company?.name}"؟ سيتم حذف جميع البيانات المرتبطة بها.`)) {
      deleteMutation.mutate();
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isSuperAdmin()) {
    return (
      <div className="text-center py-12">
        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">غير مصرح</h3>
        <p className="mt-1 text-sm text-gray-500">
          هذه الصفحة متاحة فقط لمديري النظام
        </p>
        <div className="mt-4">
          <Button onClick={() => navigate('/dashboard')}>
            العودة للوحة التحكم
          </Button>
        </div>
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

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">خطأ في تحميل البيانات</h3>
        <p className="mt-2 text-sm text-gray-500">
          {error.response?.data?.message || 'حدث خطأ في تحميل بيانات الشركة'}
        </p>
        <div className="mt-4">
          <Button onClick={() => navigate('/companies')}>
            العودة للقائمة
          </Button>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">الشركة غير موجودة</h3>
        <div className="mt-4">
          <Button onClick={() => navigate('/companies')}>
            العودة للقائمة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/companies')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {company.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {company.industry} • {getPlanBadge(company.plan)}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <Link to={`/companies/${id}/edit`}>
            <Button icon={PencilIcon} variant="outline">
              تعديل البيانات
            </Button>
          </Link>
          <Button 
            icon={TrashIcon} 
            variant="danger"
            onClick={handleDelete}
            loading={deleteMutation.isLoading}
          >
            حذف الشركة
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">المعلومات الأساسية</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="label">اسم الشركة</label>
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{company.name}</span>
                  </div>
                </div>

                <div>
                  <label className="label">الخطة</label>
                  <div>{getPlanBadge(company.plan)}</div>
                </div>

                <div>
                  <label className="label">البريد الإلكتروني</label>
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <a href={`mailto:${company.email}`} className="text-primary-600 hover:text-primary-700">
                      {company.email}
                    </a>
                  </div>
                </div>

                <div>
                  <label className="label">رقم الهاتف</label>
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <a href={`tel:${company.phone}`} className="text-primary-600 hover:text-primary-700">
                      {company.phone || '-'}
                    </a>
                  </div>
                </div>

                <div>
                  <label className="label">الموقع الإلكتروني</label>
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
                    {company.website ? (
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                        {company.website}
                      </a>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label">الصناعة</label>
                  <span className="text-sm text-gray-900">{company.industry || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          {company.address && (company.address.street || company.address.city) && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">العنوان</h3>
              </div>
              <div className="card-body">
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div className="text-sm text-gray-900">
                    {company.address.street && <div>{company.address.street}</div>}
                    <div>
                      {[company.address.city, company.address.state, company.address.zipCode]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                    {company.address.country && <div>{company.address.country}</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          {stats && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">الإحصائيات</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{stats.users?.totalUsers || 0}</div>
                    <div className="text-sm text-gray-500">إجمالي المستخدمين</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.clients?.total || 0}</div>
                    <div className="text-sm text-gray-500">إجمالي العملاء</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.leads?.total || 0}</div>
                    <div className="text-sm text-gray-500">العملاء المحتملين</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">معلومات سريعة</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">المستخدمين</span>
                <div className="flex items-center">
                  <UsersIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm font-medium text-gray-900">
                    {company.currentUsers} / {company.maxUsers}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">السعر الشهري</span>
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(company.monthlyPrice)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">تاريخ الإنشاء</span>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-900">
                    {formatDate(company.createdAt)}
                  </span>
                </div>
              </div>

              {company.subscriptionStart && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">بداية الاشتراك</span>
                  <span className="text-sm text-gray-900">
                    {formatDate(company.subscriptionStart)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">الحالة</span>
                <div>
                  {company.isActive ? (
                    <Badge variant="success">نشطة</Badge>
                  ) : (
                    <Badge variant="gray">غير نشطة</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">الإعدادات</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">المنطقة الزمنية</span>
                <span className="text-sm text-gray-900">{company.settings?.timezone || 'UTC'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">العملة</span>
                <span className="text-sm text-gray-900">{company.settings?.currency || 'USD'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">تنسيق التاريخ</span>
                <span className="text-sm text-gray-900">{company.settings?.dateFormat || 'MM/DD/YYYY'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">الإجراءات</h3>
            </div>
            <div className="card-body space-y-3">
              <Link to={`/companies/${id}/edit`} className="block">
                <Button icon={PencilIcon} variant="outline" className="w-full">
                  تعديل البيانات
                </Button>
              </Link>
              
              <Button
                onClick={() => window.open(`mailto:${company.email}`, '_blank')}
                variant="outline"
                className="w-full"
                icon={EnvelopeIcon}
              >
                إرسال بريد إلكتروني
              </Button>

              <Button
                onClick={() => window.open(`tel:${company.phone}`, '_blank')}
                variant="outline" 
                className="w-full"
                icon={PhoneIcon}
                disabled={!company.phone}
              >
                اتصال هاتفي
              </Button>

              {company.website && (
                <Button
                  onClick={() => window.open(company.website, '_blank')}
                  variant="outline" 
                  className="w-full"
                  icon={GlobeAltIcon}
                >
                  زيارة الموقع
                </Button>
              )}

              <Button
                icon={TrashIcon}
                variant="danger"
                onClick={handleDelete}
                loading={deleteMutation.isLoading}
                className="w-full"
              >
                حذف الشركة
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;

