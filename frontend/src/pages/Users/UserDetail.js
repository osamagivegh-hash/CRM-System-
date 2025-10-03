import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  ArrowLeftIcon, 
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  UserCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Fetch user data
  const { data: user, isLoading, error } = useQuery(
    ['user', id],
    () => usersAPI.getUser(id),
    {
      select: (response) => response.data
    }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <XCircleIcon className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
        <p className="text-gray-600 mb-4">
          {error.response?.data?.message || 'حدث خطأ أثناء تحميل بيانات المستخدم'}
        </p>
        <Button variant="outline" onClick={() => navigate('/users')}>
          العودة إلى قائمة المستخدمين
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <UserCircleIcon className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">المستخدم غير موجود</h3>
        <p className="text-gray-600 mb-4">لم يتم العثور على المستخدم المطلوب</p>
        <Button variant="outline" onClick={() => navigate('/users')}>
          العودة إلى قائمة المستخدمين
        </Button>
      </div>
    );
  }

  const getRoleBadgeColor = (roleName) => {
    const colors = {
      'super_admin': 'red',
      'company_admin': 'purple',
      'manager': 'blue',
      'sales_rep': 'green',
      'user': 'gray'
    };
    return colors[roleName] || 'gray';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeftIcon}
            onClick={() => navigate('/users')}
          >
            العودة
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        {hasPermission('update_users') && (
          <Link to={`/users/${user._id}/edit`}>
            <Button icon={PencilIcon}>
              تعديل المستخدم
            </Button>
          </Link>
        )}
      </div>

      {/* User Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium">معلومات المستخدم</h3>
            </div>
            <div className="card-body">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">الاسم الأول</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.firstName}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">الاسم الأخير</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.lastName}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">البريد الإلكتروني</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {user.email}
                  </dd>
                </div>

                {user.phone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">رقم الهاتف</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {user.phone}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500">الدور</dt>
                  <dd className="mt-1">
                    <Badge color={getRoleBadgeColor(user.role?.name)}>
                      {user.role?.displayName || user.role?.name}
                    </Badge>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">الحالة</dt>
                  <dd className="mt-1">
                    <Badge color={user.isActive ? 'green' : 'red'}>
                      {user.isActive ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </dd>
                </div>

                {user.company && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">الشركة</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-center">
                      <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {user.company.name}
                    </dd>
                  </div>
                )}

                {user.tenant && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">المستأجر</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.tenant.name}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500">تاريخ الإنشاء</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                  </dd>
                </div>

                {user.lastLogin && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">آخر تسجيل دخول</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {new Date(user.lastLogin).toLocaleString('ar-EG')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Role Permissions */}
          {user.role?.permissions && user.role.permissions.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium">الصلاحيات</h3>
              </div>
              <div className="card-body">
                <div className="space-y-2">
                  {user.role.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-700">
                        {permission.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Account Status */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium">حالة الحساب</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">الحساب نشط</span>
                  {user.isActive ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">البريد مؤكد</span>
                  {user.emailVerified ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;



