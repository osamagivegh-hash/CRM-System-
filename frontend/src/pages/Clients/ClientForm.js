import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from 'react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { clientsAPI, usersAPI, companiesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import toast from 'react-hot-toast';

const ClientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [formData, setFormData] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
    watch
  } = useForm();

  // Get client data for editing - SIMPLIFIED VERSION
  const { data: clientResponse, isLoading, error: queryError } = useQuery(
    ['client', id],
    async () => {
      console.log('🚀 FETCHING CLIENT DATA for ID:', id);
      const response = await clientsAPI.getClient(id);
      console.log('🎯 RAW API RESPONSE:', response);
      return response;
    },
    {
      enabled: isEdit && Boolean(id),
      retry: 3,
      retryDelay: 1000,
      refetchOnWindowFocus: false
    }
  );

  // IMMEDIATE DATA PROCESSING - No useEffect delays
  const processClientData = (response) => {
    console.log('🎯 IMMEDIATE DATA PROCESSING TRIGGERED');
    console.log('📦 Processing Response:', response);
    
    if (!response || !response.data) {
      console.error('❌ No response or response.data');
      return;
    }
    
    // DETAILED RESPONSE ANALYSIS
    console.log('🔍 ANALYZING RESPONSE STRUCTURE...');
    console.log('📊 response:', response);
    console.log('📊 response.data:', response.data);
    console.log('📊 Type of response.data:', typeof response.data);
    console.log('📊 Keys in response.data:', Object.keys(response.data || {}));
    
    // Try different possible structures
    let clientData = null;
    
    // Option 1: Direct in response.data
    if (response.data && response.data._id) {
      clientData = response.data;
      console.log('✅ Found client data directly in response.data');
    }
    // Option 2: Nested in response.data.data
    else if (response.data && response.data.data && response.data.data._id) {
      clientData = response.data.data;
      console.log('✅ Found client data in response.data.data');
    }
    // Option 3: In response.data.client
    else if (response.data && response.data.client && response.data.client._id) {
      clientData = response.data.client;
      console.log('✅ Found client data in response.data.client');
    }
    // Option 4: Check if response.data has success property
    else if (response.data && response.data.success && response.data.data) {
      clientData = response.data.data;
      console.log('✅ Found client data in success response format');
    }
    
    console.log('🔍 EXTRACTED CLIENT DATA:', clientData);
    
    if (!clientData) {
      console.error('❌ Could not find client data in any expected location');
      console.error('📊 Full response structure:', JSON.stringify(response, null, 2));
      toast.error('بيانات العميل غير صحيحة - تحقق من وحدة التحكم');
      return;
    }
    
    if (!clientData._id) {
      console.error('❌ Client data found but missing _id:', clientData);
      console.error('📊 Client data keys:', Object.keys(clientData));
      toast.error('بيانات العميل غير مكتملة - معرف مفقود');
      return;
    }
    
    console.log('✅ Valid client data found:', clientData);
    
    // Prepare form data
    const preparedFormData = {
      firstName: clientData.firstName || '',
      lastName: clientData.lastName || '',
      email: clientData.email || '',
      phone: clientData.phone || '',
      companyName: clientData.companyName || '',
      jobTitle: clientData.jobTitle || '',
      industry: clientData.industry || '',
      status: clientData.status || 'potential',
      source: clientData.source || 'other',
      value: clientData.value || 0,
      currency: clientData.currency || 'USD',
      assignedTo: (clientData.assignedTo && clientData.assignedTo._id) ? clientData.assignedTo._id : '',
      'address.street': clientData.address?.street || '',
      'address.city': clientData.address?.city || '',
      'address.state': clientData.address?.state || '',
      'address.zipCode': clientData.address?.zipCode || '',
      'address.country': clientData.address?.country || ''
    };
    
    console.log('🎯 PREPARED FORM DATA:', preparedFormData);
    
    // Store in state for debug panel
    setFormData(preparedFormData);
    setDataLoaded(true);
    
    // Set form values immediately
    console.log('🔄 SETTING FORM VALUES WITH setValue...');
    
    // Set each field individually with error handling
    try {
      setValue('firstName', preparedFormData.firstName);
      setValue('lastName', preparedFormData.lastName);
      setValue('email', preparedFormData.email);
      setValue('phone', preparedFormData.phone);
      setValue('companyName', preparedFormData.companyName);
      setValue('jobTitle', preparedFormData.jobTitle);
      setValue('industry', preparedFormData.industry);
      setValue('status', preparedFormData.status);
      setValue('source', preparedFormData.source);
      setValue('value', preparedFormData.value);
      setValue('currency', preparedFormData.currency);
      setValue('assignedTo', preparedFormData.assignedTo);
      setValue('address.street', preparedFormData['address.street']);
      setValue('address.city', preparedFormData['address.city']);
      setValue('address.state', preparedFormData['address.state']);
      setValue('address.zipCode', preparedFormData['address.zipCode']);
      setValue('address.country', preparedFormData['address.country']);
      
      console.log('✅ All setValue calls completed successfully');
      toast.success('✅ تم تحميل بيانات العميل بنجاح');
    } catch (error) {
      console.error('❌ Error setting form values:', error);
      toast.error('حدث خطأ في تحديث النموذج');
    }
  };

  // Process data immediately when available
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { 
      isEdit, 
      hasClientResponse: Boolean(clientResponse), 
      isLoading, 
      dataLoaded 
    });
    
    if (isEdit && clientResponse && !isLoading && !dataLoaded) {
      console.log('🚀 TRIGGERING DATA PROCESSING...');
      processClientData(clientResponse);
    }
  }, [clientResponse, isLoading, isEdit, dataLoaded]);

  // Watch for company selection changes
  const selectedCompany = watch('companyId');
  
  // Get users for assignment - filter by selected company for super admin
  const { data: users } = useQuery(
    ['users', selectedCompany || user?.company?._id],
    () => {
      const params = {};
      // For super admin, filter by selected company, otherwise use user's company
      if (user?.role?.name === 'super_admin') {
        const companyToFilter = selectedCompany || user?.company?._id;
        if (companyToFilter) {
          params.company = companyToFilter;
        }
      }
      return usersAPI.getUsers(params);
    },
    {
      select: (response) => response.data.data,
      enabled: Boolean(user?.company?._id || selectedCompany)
    }
  );

  // Get companies for selection (Super Admin only)
  const { data: companies } = useQuery(
    ['companies'],
    () => companiesAPI.getCompanies(),
    {
      select: (response) => response.data.data,
      enabled: user?.role?.name === 'super_admin'
    }
  );

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      console.log('🚀 FORM SUBMISSION STARTED');
      console.log('📝 Form Data Received:', data);
      console.log('🔧 Is Edit Mode:', isEdit);
      console.log('🆔 Client ID:', id);
      
      // Restructure nested address data
      const formattedData = {
        ...data,
        address: {
          street: data['address.street'] || '',
          city: data['address.city'] || '',
          state: data['address.state'] || '',
          zipCode: data['address.zipCode'] || '',
          country: data['address.country'] || '',
        }
      };

      // Remove the flattened address fields
      delete formattedData['address.street'];
      delete formattedData['address.city'];
      delete formattedData['address.state'];
      delete formattedData['address.zipCode'];
      delete formattedData['address.country'];

      // Handle company assignment for Super Admin
      if (user?.role?.name === 'super_admin' && formattedData.companyId) {
        formattedData.company = formattedData.companyId;
        delete formattedData.companyId;
      }
      
      console.log('📦 Formatted Data for API:', formattedData);
      
      if (isEdit) {
        console.log('🔄 UPDATING CLIENT...');
        console.log('🎯 Update URL:', `/api/clients/${id}`);
        console.log('📊 Update Data:', formattedData);
        
        const response = await clientsAPI.updateClient(id, formattedData);
        console.log('✅ UPDATE RESPONSE:', response);
        
        // INVALIDATE REACT QUERY CACHE TO REFRESH UI
        console.log('🔄 INVALIDATING QUERY CACHE...');
        await queryClient.invalidateQueries(['clients']);
        await queryClient.invalidateQueries(['client', id]);
        await queryClient.invalidateQueries(['dashboard']);
        console.log('✅ CACHE INVALIDATED');
        
        toast.success('تم تحديث العميل بنجاح');
      } else {
        console.log('➕ CREATING NEW CLIENT...');
        console.log('📊 Create Data:', formattedData);
        
        const response = await clientsAPI.createClient(formattedData);
        console.log('✅ CREATE RESPONSE:', response);
        
        // INVALIDATE REACT QUERY CACHE TO REFRESH UI
        console.log('🔄 INVALIDATING QUERY CACHE FOR NEW CLIENT...');
        await queryClient.invalidateQueries(['clients']);
        await queryClient.invalidateQueries(['dashboard']);
        console.log('✅ CACHE INVALIDATED');
        
        toast.success('تم إضافة العميل بنجاح');
      }
      
      console.log('🎯 OPERATION COMPLETED SUCCESSFULLY');
      navigate('/clients');
    } catch (error) {
      console.error('❌ FORM SUBMISSION ERROR:', error);
      console.error('📊 Error Response:', error.response);
      console.error('📊 Error Data:', error.response?.data);
      console.error('📊 Error Status:', error.response?.status);
      console.error('📊 Error Headers:', error.response?.headers);
      console.error('📊 Error Config:', error.config);
      console.error('📊 Request URL:', error.config?.url);
      console.error('📊 Request Method:', error.config?.method);
      console.error('📊 Request Data:', error.config?.data);
      
      // Show detailed error information
      let errorMessage = 'حدث خطأ في الحفظ';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'خطأ في الخادم - تحقق من وحدة التحكم للحصول على تفاصيل أكثر';
      } else if (error.response?.status === 400) {
        errorMessage = 'بيانات غير صحيحة - تحقق من الحقول المطلوبة';
      } else if (error.response?.status === 403) {
        errorMessage = 'ليس لديك صلاحية للقيام بهذا الإجراء';
      } else if (error.response?.status === 401) {
        errorMessage = 'يجب تسجيل الدخول أولاً';
      }
      
      toast.error(errorMessage);
      
      // Additional debugging for validation errors
      if (error.response?.data?.validationErrors) {
        console.error('📊 Validation Errors:', error.response.data.validationErrors);
        error.response.data.validationErrors.forEach(err => {
          console.error(`❌ Field: ${err.field}, Message: ${err.message}, Value: ${err.value}`);
        });
      }
      
      // Don't navigate away on error
    } finally {
      setLoading(false);
      console.log('🏁 FORM SUBMISSION ENDED');
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات العميل...</p>
          <p className="text-sm text-gray-400 mt-2">Client ID: {id}</p>
        </div>
      </div>
    );
  }

  // Debug information
  console.log('🔍 ClientForm Debug Info:', {
    isEdit,
    id,
    isLoading,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="space-y-6">
      {/* ENHANCED DEBUG PANEL */}
      {isEdit && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">🔍 Enhanced Debug Information</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Edit Mode:</strong> {isEdit ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>Client ID:</strong> {id || '❌ Not set'}
            </div>
            <div>
              <strong>Loading:</strong> {isLoading ? '🔄 Yes' : '✅ No'}
            </div>
            <div>
              <strong>Query Error:</strong> {queryError ? '❌ Yes' : '✅ No'}
            </div>
            <div>
              <strong>API Response:</strong> {clientResponse ? '✅ Received' : '❌ Not received'}
            </div>
            <div>
              <strong>Data Loaded:</strong> {dataLoaded ? '✅ Yes' : '❌ No'}
            </div>
            {formData && (
              <div className="col-span-3 mt-2 p-2 bg-white rounded border">
                <strong>📊 Loaded Data Sample:</strong>
                <div className="mt-1 text-xs">
                  <div>Name: {formData.firstName} {formData.lastName}</div>
                  <div>Email: {formData.email}</div>
                  <div>Company: {formData.companyName}</div>
                  <div>Status: {formData.status}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔧 MANUAL FORM POPULATION TRIGGERED');
                    if (clientResponse) {
                      processClientData(clientResponse);
                    } else if (formData) {
                      Object.keys(formData).forEach(key => {
                        setValue(key, formData[key]);
                        console.log(`🔧 Manual setValue(${key}, "${formData[key]}")`);
                      });
                      toast.info('تم تحديث النموذج يدوياً');
                    } else {
                      toast.error('لا توجد بيانات للتحديث');
                    }
                  }}
                  className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  🔧 Force Form Update
                </button>
              </div>
            )}
            
            {clientResponse && !dataLoaded && (
              <div className="col-span-3 mt-2 p-2 bg-red-50 rounded border border-red-200">
                <strong className="text-red-800">⚠️ Data received but not processed!</strong>
                <div className="text-xs text-red-600 mt-1">
                  Check console for processing errors
                </div>
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔍 MANUAL DEBUG INSPECTION:');
                    console.log('📊 clientResponse:', clientResponse);
                    console.log('📊 clientResponse.data:', clientResponse.data);
                    console.log('📊 Type of clientResponse:', typeof clientResponse);
                    console.log('📊 Keys in clientResponse:', Object.keys(clientResponse || {}));
                    
                    if (clientResponse && clientResponse.data) {
                      console.log('📊 Keys in clientResponse.data:', Object.keys(clientResponse.data));
                      console.log('📊 clientResponse.data._id:', clientResponse.data._id);
                      console.log('📊 clientResponse.data.success:', clientResponse.data.success);
                      console.log('📊 clientResponse.data.data:', clientResponse.data.data);
                    }
                    
                    // Try to process it manually
                    processClientData(clientResponse);
                  }}
                  className="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                >
                  🔍 Debug & Process Data
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/clients')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {isEdit ? 'تعديل العميل' : 'إضافة عميل جديد'}
              {isEdit && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md">
                  وضع التعديل - ID: {id}
                </span>
              )}
            </h2>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="card-body space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">المعلومات الأساسية</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="label">الاسم الأول *</label>
                <input
                  {...register('firstName', {
                    required: 'الاسم الأول مطلوب',
                    minLength: { value: 2, message: 'الاسم يجب أن يكون أطول من حرفين' }
                  })}
                  type="text"
                  className={`input ${errors.firstName ? 'input-error' : ''}`}
                  placeholder="أدخل الاسم الأول"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="label">الاسم الأخير *</label>
                <input
                  {...register('lastName', {
                    required: 'الاسم الأخير مطلوب',
                    minLength: { value: 2, message: 'الاسم يجب أن يكون أطول من حرفين' }
                  })}
                  type="text"
                  className={`input ${errors.lastName ? 'input-error' : ''}`}
                  placeholder="أدخل الاسم الأخير"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label className="label">البريد الإلكتروني *</label>
                <input
                  {...register('email', {
                    required: 'البريد الإلكتروني مطلوب',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'البريد الإلكتروني غير صحيح'
                    }
                  })}
                  type="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label">رقم الهاتف</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="input"
                  placeholder="+966 50 123 4567"
                />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات الشركة</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="label">اسم الشركة</label>
                <input
                  {...register('companyName')}
                  type="text"
                  className="input"
                  placeholder="اسم شركة العميل"
                />
              </div>

              <div>
                <label className="label">المسمى الوظيفي</label>
                <input
                  {...register('jobTitle')}
                  type="text"
                  className="input"
                  placeholder="مدير، مدير تنفيذي، إلخ"
                />
              </div>

              <div>
                <label className="label">الصناعة</label>
                <select {...register('industry')} className="input">
                  <option value="">اختر الصناعة</option>
                  <option value="technology">تكنولوجيا</option>
                  <option value="healthcare">رعاية صحية</option>
                  <option value="finance">مالية</option>
                  <option value="education">تعليم</option>
                  <option value="retail">تجارة تجزئة</option>
                  <option value="manufacturing">تصنيع</option>
                  <option value="consulting">استشارات</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div>
                <label className="label">حالة العميل</label>
                <select {...register('status')} className="input">
                  <option value="potential">محتمل</option>
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                  <option value="lost">مفقود</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات إضافية</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="label">مصدر العميل</label>
                <select {...register('source')} className="input">
                  <option value="website">الموقع الإلكتروني</option>
                  <option value="referral">إحالة</option>
                  <option value="social_media">وسائل التواصل الاجتماعي</option>
                  <option value="email_campaign">حملة بريد إلكتروني</option>
                  <option value="cold_call">اتصال بارد</option>
                  <option value="trade_show">معرض تجاري</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div>
                <label className="label">القيمة المتوقعة</label>
                <input
                  {...register('value', {
                    min: { value: 0, message: 'القيمة يجب أن تكون أكبر من الصفر' }
                  })}
                  type="number"
                  className={`input ${errors.value ? 'input-error' : ''}`}
                  placeholder="0"
                />
                {errors.value && (
                  <p className="mt-1 text-sm text-red-600">{errors.value.message}</p>
                )}
              </div>

              <div>
                <label className="label">مسؤول الحساب</label>
                <select {...register('assignedTo')} className="input">
                  <option value="">اختر مسؤول الحساب</option>
                  {users?.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">العملة</label>
                <select {...register('currency')} className="input">
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="AED">درهم إماراتي (AED)</option>
                  <option value="EUR">يورو (EUR)</option>
                </select>
              </div>

              {/* Company selection for Super Admin */}
              {user?.role?.name === 'super_admin' && (
                <div>
                  <label className="label">الشركة المالكة</label>
                  <select {...register('companyId')} className="input">
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

          {/* Address */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">العنوان</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">الشارع</label>
                <input
                  {...register('address.street')}
                  type="text"
                  className="input"
                  placeholder="رقم المبنى، اسم الشارع"
                />
              </div>

              <div>
                <label className="label">المدينة</label>
                <input
                  {...register('address.city')}
                  type="text"
                  className="input"
                  placeholder="الرياض، جدة، دبي"
                />
              </div>

              <div>
                <label className="label">المنطقة/الولاية</label>
                <input
                  {...register('address.state')}
                  type="text"
                  className="input"
                  placeholder="المنطقة أو الولاية"
                />
              </div>

              <div>
                <label className="label">الرمز البريدي</label>
                <input
                  {...register('address.zipCode')}
                  type="text"
                  className="input"
                  placeholder="12345"
                />
              </div>

              <div>
                <label className="label">البلد</label>
                <select {...register('address.country')} className="input">
                  <option value="">اختر البلد</option>
                  <option value="SA">السعودية</option>
                  <option value="AE">الإمارات</option>
                  <option value="EG">مصر</option>
                  <option value="JO">الأردن</option>
                  <option value="US">الولايات المتحدة</option>
                  <option value="GB">المملكة المتحدة</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/clients')}
            >
              إلغاء
            </Button>
            
            {/* Debug Submit Button */}
            {isEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentFormData = getValues();
                  console.log('🔍 CURRENT FORM VALUES:', currentFormData);
                  console.log('🔧 Testing manual submit...');
                  handleSubmit(onSubmit)();
                }}
                className="bg-yellow-100 text-yellow-800 border-yellow-300"
              >
                🧪 Test Save
              </Button>
            )}
            
            <Button
              type="submit"
              loading={loading}
            >
              {isEdit ? 'تحديث العميل' : 'إضافة العميل'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;
