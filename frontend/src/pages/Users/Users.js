import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Users = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch users
  const { data: usersData, isLoading, refetch } = useQuery(
    ['users', { search, role: roleFilter, isActive: statusFilter, page: currentPage }],
    () => usersAPI.getUsers({
      search,
      role: roleFilter,
      isActive: statusFilter,
      page: currentPage,
      limit: 10
    }),
    {
      select: (response) => response.data
    }
  );

  const handleDelete = async (userId, userName) => {
    if (userId === currentUser.id) {
      toast.error('لا يمكنك حذف حسابك الخاص');
      return;
    }

    if (window.confirm(`هل أنت متأكد من إلغاء تفعيل المستخدم "${userName}"؟`)) {
      try {
        await usersAPI.deleteUser(userId);
        toast.success('تم إلغاء تفعيل المستخدم بنجاح');
        refetch();
      } catch (error) {
        toast.error(error.response?.data?.message || 'حدث خطأ في إلغاء التفعيل');
      }
    }
  };

  const handleActivate = async (userId, userName) => {
    try {
      await usersAPI.activateUser(userId);
      toast.success(`تم تفعيل المستخدم "${userName}" بنجاح`);
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ في التفعيل');
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      super_admin: 'error',
      company_admin: 'primary',
      manager: 'warning',
      sales_rep: 'info',
      user: 'gray'
    };
    
    const labels = {
      super_admin: 'مدير النظام',
      company_admin: 'مدير الشركة',
      manager: 'مدير فريق',
      sales_rep: 'مندوب مبيعات',
      user: 'مستخدم'
    };

    return (
      <Badge variant={variants[role?.name] || 'gray'}>
        {labels[role?.name] || role?.displayName || 'غير محدد'}
      </Badge>
    );
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
            المستخدمين
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            إدارة أعضاء الفريق وأدوارهم
          </p>
        </div>
        {hasPermission('create_users') && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link to="/users/new">
              <Button icon={PlusIcon}>
                إضافة مستخدم
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
                placeholder="البحث في المستخدمين..."
                className="input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div>
              <select
                className="input"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">جميع الأدوار</option>
                <option value="super_admin">مدير النظام</option>
                <option value="company_admin">مدير الشركة</option>
                <option value="manager">مدير فريق</option>
                <option value="sales_rep">مندوب مبيعات</option>
                <option value="user">مستخدم</option>
              </select>
            </div>

            <div>
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">جميع الحالات</option>
                <option value="true">نشط</option>
                <option value="false">غير نشط</option>
              </select>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('');
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

      {/* Users Table */}
      <div className="card">
        <div className="overflow-hidden">
          {usersData?.data?.length > 0 ? (
            <>
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">المستخدم</th>
                    <th className="table-header-cell">البريد الإلكتروني</th>
                    <th className="table-header-cell">الدور</th>
                    <th className="table-header-cell">الشركة</th>
                    <th className="table-header-cell">الحالة</th>
                    <th className="table-header-cell">آخر دخول</th>
                    <th className="table-header-cell">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {usersData.data.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-medium text-sm">
                                {user.firstName[0]}{user.lastName[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Link to={`/users/${user._id}/edit`}>
                              <div className="text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer">
                                {user.firstName} {user.lastName}
                              </div>
                            </Link>
                            <div className="text-sm text-gray-500">
                              {user.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="table-cell">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">{user.company?.name}</div>
                        <div className="text-sm text-gray-500">{user.company?.plan}</div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          {user.isActive ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-red-500 mr-1" />
                          )}
                          <span className={`text-sm ${user.isActive ? 'text-green-700' : 'text-red-700'}`}>
                            {user.isActive ? 'نشط' : 'غير نشط'}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">
                          {formatDate(user.lastLogin)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{minWidth: '200px'}}>
                        <div className="flex flex-wrap items-center justify-start gap-2" style={{display: 'flex', gap: '4px', flexWrap: 'wrap'}}>
                          {/* VIEW BUTTON - Always visible for authenticated users */}
                          <Link to={`/users/${user._id}`}>
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
                          
                          {/* EDIT BUTTON - Requires permission */}
                          {hasPermission('update_users') && (
                            <Link to={`/users/${user._id}/edit`}>
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
                          
                          {/* ACTIVATE BUTTON - Requires permission and inactive user */}
                          {hasPermission('update_users') && !user.isActive && (
                            <button
                              onClick={() => handleActivate(user._id, `${user.firstName} ${user.lastName}`)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: '#eab308',
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
                              <CheckCircleIcon style={{width: '12px', height: '12px'}} />
                              تفعيل
                            </button>
                          )}
                          
                          {/* DELETE BUTTON - Requires permission and active user (not self) */}
                          {hasPermission('delete_users') && user.isActive && user._id !== currentUser.id && (
                            <button
                              onClick={() => handleDelete(user._id, `${user.firstName} ${user.lastName}`)}
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
                              إلغاء تفعيل
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {usersData.pagination && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={!usersData.pagination.prev}
                    >
                      السابق
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!usersData.pagination.next}
                    >
                      التالي
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        عرض <span className="font-medium">{usersData.count}</span> من{' '}
                        <span className="font-medium">{usersData.total}</span> مستخدم
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={!usersData.pagination.prev}
                          className="rounded-r-md"
                        >
                          السابق
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={!usersData.pagination.next}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مستخدمين</h3>
              <p className="mt-1 text-sm text-gray-500">
                ابدأ بإضافة مستخدمين جدد لفريقك
              </p>
              {hasPermission('create_users') && (
                <div className="mt-6">
                  <Link to="/users/new">
                    <Button icon={PlusIcon}>
                      إضافة مستخدم جديد
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

export default Users;
