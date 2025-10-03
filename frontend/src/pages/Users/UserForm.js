import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from 'react-query';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { usersAPI, rolesAPI, superAdminAPI, companiesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import Button from '../../components/UI/Button';
import toast from 'react-hot-toast';

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { isSuperAdmin } = useAuth();
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm();

  const password = watch('password');

  // Get user data for editing - BULLETPROOF VERSION (Same as ClientForm)
  const { data: userResponse, isLoading, error: queryError } = useQuery(
    ['user', id],
    async () => {
      console.log('🚀 FETCHING USER DATA for ID:', id);
      const response = await usersAPI.getUser(id);
      console.log('🎯 RAW USER API RESPONSE:', response);
      return response;
    },
    {
      enabled: isEdit && Boolean(id),
      retry: 3,
      retryDelay: 1000,
      refetchOnWindowFocus: false
    }
  );

  // IMMEDIATE USER DATA PROCESSING - Same approach as ClientForm
  const processUserData = (response) => {
    console.log('🎯 IMMEDIATE USER DATA PROCESSING TRIGGERED');
    console.log('📦 Processing User Response:', response);
    
    if (!response || !response.data) {
      console.error('❌ No response or response.data');
      return;
    }
    
    // DETAILED RESPONSE ANALYSIS
    console.log('🔍 ANALYZING USER RESPONSE STRUCTURE...');
    console.log('📊 response:', response);
    console.log('📊 response.data:', response.data);
    console.log('📊 Type of response.data:', typeof response.data);
    console.log('📊 Keys in response.data:', Object.keys(response.data || {}));
    
    // Try different possible structures
    let userData = null;
    
    // Option 1: Direct in response.data
    if (response.data && response.data._id) {
      userData = response.data;
      console.log('✅ Found user data directly in response.data');
    }
    // Option 2: Nested in response.data.data
    else if (response.data && response.data.data && response.data.data._id) {
      userData = response.data.data;
      console.log('✅ Found user data in response.data.data');
    }
    // Option 3: Check if response.data has success field
    else if (response.data && response.data.success && response.data.user) {
      userData = response.data.user;
      console.log('✅ Found user data in response.data.user');
    }
    
    if (userData) {
      console.log('👤 Processing user:', userData.firstName, userData.lastName);
      console.log('📋 Full user data:', userData);
      
      // Prepare form data
      const formData = {
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role?._id || '',
        tenant: userData.tenant?._id || '',
        company: userData.company?._id || '',
        isActive: userData.isActive !== undefined ? userData.isActive : true
      };
      
      // Set selected tenant for company loading
      if (userData.tenant?._id) {
        setSelectedTenant(userData.tenant._id);
      }
      
      console.log('📝 Form data prepared:', formData);
      reset(formData);
      toast.success('تم تحميل بيانات المستخدم بنجاح');
      return true;
    } else {
      console.error('❌ Could not extract user data from response');
      console.error('🔍 Available keys in response:', Object.keys(response || {}));
      console.error('🔍 Available keys in response.data:', Object.keys(response?.data || {}));
      toast.error('خطأ في تحليل بيانات المستخدم');
      return false;
    }
  };

  // Process data immediately when userResponse changes
  useEffect(() => {
    if (userResponse && isEdit) {
      const success = processUserData(userResponse);
      if (!success) {
        console.error('❌ Failed to process user data, navigating back');
        // Don't navigate back automatically, let user see the error
      }
    }
  }, [userResponse, isEdit]);

  // Handle loading error
  useEffect(() => {
    if (queryError) {
      console.error('❌ Query error:', queryError);
      const errorMessage = queryError.response?.data?.message || 'حدث خطأ في تحميل بيانات المستخدم';
      toast.error(errorMessage);
      
      // If it's an access denied error, navigate back
      if (queryError.response?.status === 403) {
        setTimeout(() => navigate('/users'), 2000);
      }
    }
  }, [queryError, navigate]);

  // Get available roles from API
  const { data: roles } = useQuery(
    ['roles'],
    () => rolesAPI.getRoles(),
    {
      select: (response) => response.data.data
    }
  );

  // Get tenants for super admin
  const { data: tenants } = useQuery(
    ['tenants'],
    () => superAdminAPI.getTenants({ limit: 100 }),
    {
      enabled: isSuperAdmin(),
      select: (response) => response.data.data
    }
  );

  // Get companies based on selected tenant
  const { data: companies } = useQuery(
    ['companies', selectedTenant],
    () => companiesAPI.getCompanies({ tenant: selectedTenant, limit: 100 }),
    {
      enabled: Boolean(selectedTenant) && isSuperAdmin(),
      select: (response) => response.data.data
    }
  );

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      console.log('📤 Submitting user data:', data);

      // Clean up the data
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || '',
        role: data.role,
        isActive: data.isActive
      };

      // Add tenant and company information
      if (isSuperAdmin()) {
        // Super admin can specify tenant and company
        if (data.tenant) userData.tenant = data.tenant;
        if (data.company) userData.company = data.company;
      } else {
        // Regular users: backend will auto-assign based on requesting user's context
        // But we can send the current user's company as a hint
        console.log('👤 Non-super admin user creating user - backend will handle tenant/company assignment');
      }

      // Add password for new users
      if (!isEdit && data.password) {
        userData.password = data.password;
      }

      let response;
      if (isEdit) {
        response = await usersAPI.updateUser(id, userData);
        toast.success('تم تحديث المستخدم بنجاح');
      } else {
        response = await usersAPI.createUser(userData);
        toast.success('تم إنشاء المستخدم بنجاح');
      }

      navigate('/users');
    } catch (error) {
      console.error('❌ Error submitting user:', error);
      const errorMessage = error.response?.data?.message || 'حدث خطأ في حفظ البيانات';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات المستخدم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
            {isEdit ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* First Name */}
              <div>
                <label className="label">
                  الاسم الأول <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`input ${errors.firstName ? 'border-red-500' : ''}`}
                  {...register('firstName', {
                    required: 'الاسم الأول مطلوب',
                    minLength: { value: 2, message: 'الاسم يجب أن يكون على الأقل حرفين' }
                  })}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="label">
                  الاسم الأخير <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`input ${errors.lastName ? 'border-red-500' : ''}`}
                  {...register('lastName', {
                    required: 'الاسم الأخير مطلوب',
                    minLength: { value: 2, message: 'الاسم يجب أن يكون على الأقل حرفين' }
                  })}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="label">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className={`input ${errors.email ? 'border-red-500' : ''}`}
                  {...register('email', {
                    required: 'البريد الإلكتروني مطلوب',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'البريد الإلكتروني غير صحيح'
                    }
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="label">رقم الهاتف</label>
                <input
                  type="tel"
                  className="input"
                  {...register('phone')}
                />
              </div>

              {/* Role */}
              <div>
                <label className="label">
                  الدور <span className="text-red-500">*</span>
                </label>
                <select
                  className={`input ${errors.role ? 'border-red-500' : ''}`}
                  {...register('role', { required: 'الدور مطلوب' })}
                >
                  <option value="">اختر الدور</option>
                  {roles?.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.displayName}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
                )}
              </div>

              {/* Password for new users */}
              {!isEdit && (
                <div>
                  <label className="label">
                    كلمة المرور <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`input ${errors.password ? 'border-red-500' : ''}`}
                      {...register('password', {
                        required: 'كلمة المرور مطلوبة',
                        minLength: { value: 6, message: 'كلمة المرور يجب أن تكون على الأقل 6 أحرف' },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message: 'كلمة المرور يجب أن تحتوي على حرف صغير وحرف كبير ورقم على الأقل'
                        }
                      })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل، حرف كبير، حرف صغير، ورقم
                  </p>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="label">حالة المستخدم</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    {...register('isActive')}
                  />
                  <span className="mr-2 text-sm text-gray-700">المستخدم نشط</span>
                </div>
              </div>
            </div>

            {/* Super Admin Fields */}
            {isSuperAdmin() && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">إعدادات المدير</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Tenant */}
                  <div>
                    <label className="label">المستأجر</label>
                    <select
                      className="input"
                      {...register('tenant')}
                      onChange={(e) => setSelectedTenant(e.target.value)}
                    >
                      <option value="">اختر المستأجر</option>
                      {tenants?.map((tenant) => (
                        <option key={tenant._id} value={tenant._id}>
                          {tenant.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Company */}
                  {selectedTenant && (
                    <div>
                      <label className="label">الشركة</label>
                      <select className="input" {...register('company')}>
                        <option value="">اختر الشركة</option>
                        {companies?.map((company) => (
                          <option key={company._id} value={company._id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/users')}
              >
                إلغاء
              </Button>
              <Button type="submit" loading={loading}>
                {isEdit ? 'تحديث المستخدم' : 'إنشاء المستخدم'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm;