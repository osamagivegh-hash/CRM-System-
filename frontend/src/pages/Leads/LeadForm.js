import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from 'react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { leadsAPI, usersAPI } from '../../services/api';
import Button from '../../components/UI/Button';
import toast from 'react-hot-toast';

const LeadForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
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
    getValues
  } = useForm();

  // Get lead data for editing - BULLETPROOF VERSION (Same as ClientForm)
  const { data: leadResponse, isLoading, error: queryError } = useQuery(
    ['lead', id],
    async () => {
      console.log('🚀 FETCHING LEAD DATA for ID:', id);
      const response = await leadsAPI.getLead(id);
      console.log('🎯 RAW LEAD API RESPONSE:', response);
      return response;
    },
    {
      enabled: isEdit && Boolean(id),
      retry: 3,
      retryDelay: 1000,
      refetchOnWindowFocus: false
    }
  );

  // IMMEDIATE LEAD DATA PROCESSING - Same approach as ClientForm
  const processLeadData = (response) => {
    console.log('🎯 IMMEDIATE LEAD DATA PROCESSING TRIGGERED');
    console.log('📦 Processing Lead Response:', response);
    
    if (!response || !response.data) {
      console.error('❌ No response or response.data');
      return;
    }
    
    // DETAILED RESPONSE ANALYSIS
    console.log('🔍 ANALYZING LEAD RESPONSE STRUCTURE...');
    console.log('📊 response:', response);
    console.log('📊 response.data:', response.data);
    console.log('📊 Type of response.data:', typeof response.data);
    console.log('📊 Keys in response.data:', Object.keys(response.data || {}));
    
    // Try different possible structures
    let leadData = null;
    
    // Option 1: Direct in response.data
    if (response.data && response.data._id) {
      leadData = response.data;
      console.log('✅ Found lead data directly in response.data');
    }
    // Option 2: Nested in response.data.data
    else if (response.data && response.data.data && response.data.data._id) {
      leadData = response.data.data;
      console.log('✅ Found lead data in response.data.data');
    }
    // Option 3: In response.data.lead
    else if (response.data && response.data.lead && response.data.lead._id) {
      leadData = response.data.lead;
      console.log('✅ Found lead data in response.data.lead');
    }
    // Option 4: Check if response.data has success property
    else if (response.data && response.data.success && response.data.data) {
      leadData = response.data.data;
      console.log('✅ Found lead data in success response format');
    }
    
    console.log('🔍 EXTRACTED LEAD DATA:', leadData);
    
    if (!leadData) {
      console.error('❌ Could not find lead data in any expected location');
      console.error('📊 Full response structure:', JSON.stringify(response, null, 2));
      toast.error('بيانات العميل المحتمل غير صحيحة - تحقق من وحدة التحكم');
      return;
    }
    
    if (!leadData._id) {
      console.error('❌ Lead data found but missing _id:', leadData);
      console.error('📊 Lead data keys:', Object.keys(leadData));
      toast.error('بيانات العميل المحتمل غير مكتملة - معرف مفقود');
      return;
    }
    
    console.log('✅ Valid lead data found:', leadData);
    
    // Prepare form data
    const preparedFormData = {
      firstName: leadData.firstName || '',
      lastName: leadData.lastName || '',
      email: leadData.email || '',
      phone: leadData.phone || '',
      companyName: leadData.companyName || '',
      jobTitle: leadData.jobTitle || '',
      industry: leadData.industry || '',
      source: leadData.source || 'other',
      status: leadData.status || 'new',
      priority: leadData.priority || 'medium',
      assignedTo: (leadData.assignedTo && leadData.assignedTo._id) ? leadData.assignedTo._id : '',
      estimatedValue: leadData.estimatedValue || 0,
      probability: leadData.probability || 10,
      currency: leadData.currency || 'USD',
      'address.street': leadData.address?.street || '',
      'address.city': leadData.address?.city || '',
      'address.state': leadData.address?.state || '',
      'address.zipCode': leadData.address?.zipCode || '',
      'address.country': leadData.address?.country || ''
    };
    
    // Handle date formatting
    if (leadData.expectedCloseDate) {
      try {
        preparedFormData.expectedCloseDate = new Date(leadData.expectedCloseDate).toISOString().split('T')[0];
      } catch (e) {
        console.warn('⚠️ Invalid date format:', leadData.expectedCloseDate);
        preparedFormData.expectedCloseDate = '';
      }
    } else {
      preparedFormData.expectedCloseDate = '';
    }
    
    console.log('🎯 PREPARED LEAD FORM DATA:', preparedFormData);
    
    // Store in state for debug panel
    setFormData(preparedFormData);
    setDataLoaded(true);
    
    // Set form values immediately
    console.log('🔄 SETTING LEAD FORM VALUES WITH setValue...');
    
    // Set each field individually with error handling
    try {
      setValue('firstName', preparedFormData.firstName);
      setValue('lastName', preparedFormData.lastName);
      setValue('email', preparedFormData.email);
      setValue('phone', preparedFormData.phone);
      setValue('companyName', preparedFormData.companyName);
      setValue('jobTitle', preparedFormData.jobTitle);
      setValue('industry', preparedFormData.industry);
      setValue('source', preparedFormData.source);
      setValue('status', preparedFormData.status);
      setValue('priority', preparedFormData.priority);
      setValue('assignedTo', preparedFormData.assignedTo);
      setValue('estimatedValue', preparedFormData.estimatedValue);
      setValue('probability', preparedFormData.probability);
      setValue('currency', preparedFormData.currency);
      setValue('expectedCloseDate', preparedFormData.expectedCloseDate);
      setValue('address.street', preparedFormData['address.street']);
      setValue('address.city', preparedFormData['address.city']);
      setValue('address.state', preparedFormData['address.state']);
      setValue('address.zipCode', preparedFormData['address.zipCode']);
      setValue('address.country', preparedFormData['address.country']);
      
      console.log('✅ All lead setValue calls completed successfully');
      toast.success('✅ تم تحميل بيانات العميل المحتمل بنجاح');
    } catch (error) {
      console.error('❌ Error setting lead form values:', error);
      toast.error('حدث خطأ في تحديث نموذج العميل المحتمل');
    }
  };

  // Process lead data immediately when available
  useEffect(() => {
    console.log('🔄 Lead useEffect triggered:', { 
      isEdit, 
      hasLeadResponse: Boolean(leadResponse), 
      isLoading, 
      dataLoaded 
    });
    
    if (isEdit && leadResponse && !isLoading && !dataLoaded) {
      console.log('🚀 TRIGGERING LEAD DATA PROCESSING...');
      processLeadData(leadResponse);
    }
  }, [leadResponse, isLoading, isEdit, dataLoaded]);

  // Get users for assignment
  const { data: users } = useQuery(
    ['users'],
    () => usersAPI.getUsers(),
    {
      select: (response) => response.data.data
    }
  );

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
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
      
      // Convert string values to numbers for numeric fields BEFORE validation
      if (formattedData.estimatedValue) {
        const numValue = parseFloat(formattedData.estimatedValue);
        formattedData.estimatedValue = isNaN(numValue) ? 0 : numValue;
        console.log('🔢 Converted estimatedValue:', formattedData.estimatedValue, typeof formattedData.estimatedValue);
      }
      if (formattedData.probability) {
        const numValue = parseInt(formattedData.probability);
        formattedData.probability = isNaN(numValue) ? 0 : numValue;
        console.log('🔢 Converted probability:', formattedData.probability, typeof formattedData.probability);
      }
      
      // Remove empty fields that might cause validation issues
      Object.keys(formattedData).forEach(key => {
        if (formattedData[key] === '' || formattedData[key] === null || formattedData[key] === undefined) {
          delete formattedData[key];
          console.log('🗑️ Removed empty field:', key);
        }
      });
      
      console.log('🔍 FINAL FORMATTED DATA:', formattedData);
      
      // VALIDATE DATA BEFORE SENDING
      console.log('🔍 VALIDATING LEAD DATA...');
      
      // Check required fields
      const requiredFields = ['firstName', 'lastName', 'email'];
      const missingFields = requiredFields.filter(field => !formattedData[field] || formattedData[field].trim() === '');
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        toast.error(`الحقول المطلوبة مفقودة: ${missingFields.join(', ')}`);
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formattedData.email)) {
        console.error('❌ Invalid email format:', formattedData.email);
        toast.error('تنسيق البريد الإلكتروني غير صحيح');
        return;
      }
      
      // Validate numeric fields
      if (formattedData.estimatedValue && (isNaN(formattedData.estimatedValue) || formattedData.estimatedValue < 0)) {
        console.error('❌ Invalid estimated value:', formattedData.estimatedValue);
        toast.error('القيمة المتوقعة يجب أن تكون رقماً موجباً');
        return;
      }
      
      if (formattedData.probability && (isNaN(formattedData.probability) || formattedData.probability < 0 || formattedData.probability > 100)) {
        console.error('❌ Invalid probability:', formattedData.probability);
        toast.error('الاحتمالية يجب أن تكون بين 0 و 100');
        return;
      }
      
      console.log('✅ LEAD DATA VALIDATION PASSED');
      
      if (isEdit) {
        console.log('🔄 UPDATING LEAD...');
        console.log('🎯 Lead Update URL:', `/api/leads/${id}`);
        console.log('📊 Lead Update Data:', formattedData);
        
        const response = await leadsAPI.updateLead(id, formattedData);
        console.log('✅ LEAD UPDATE RESPONSE:', response);
        
        // INVALIDATE REACT QUERY CACHE TO REFRESH UI
        console.log('🔄 INVALIDATING LEAD QUERY CACHE...');
        await queryClient.invalidateQueries(['leads']);
        await queryClient.invalidateQueries(['lead', id]);
        await queryClient.invalidateQueries(['dashboard']);
        console.log('✅ LEAD CACHE INVALIDATED');
        
        toast.success('تم تحديث العميل المحتمل بنجاح');
      } else {
        console.log('➕ CREATING NEW LEAD...');
        console.log('📊 Lead Create Data:', formattedData);
        
        const response = await leadsAPI.createLead(formattedData);
        console.log('✅ LEAD CREATE RESPONSE:', response);
        
        // INVALIDATE REACT QUERY CACHE TO REFRESH UI
        console.log('🔄 INVALIDATING LEAD QUERY CACHE...');
        await queryClient.invalidateQueries(['leads']);
        await queryClient.invalidateQueries(['dashboard']);
        console.log('✅ LEAD CACHE INVALIDATED');
        
        toast.success('تم إضافة العميل المحتمل بنجاح');
      }
      
      navigate('/leads');
    } catch (error) {
      console.error('❌ LEAD FORM SUBMISSION ERROR:', error);
      console.error('📊 Lead Error Response:', error.response);
      console.error('📊 Lead Error Data:', error.response?.data);
      console.error('📊 Lead Error Status:', error.response?.status);
      
      // Handle specific error types
      if (error.response?.status === 400) {
        const validationErrors = error.response?.data?.errors;
        if (validationErrors && Array.isArray(validationErrors)) {
          console.error('❌ Validation Errors:', validationErrors);
          validationErrors.forEach((err, index) => {
            console.error(`❌ Error ${index + 1}:`, {
              field: err.path || err.param,
              message: err.msg || err.message,
              value: err.value,
              location: err.location
            });
          });
          const errorMessages = validationErrors.map(err => `${err.path || err.param}: ${err.msg || err.message}`).join(' | ');
          toast.error(`أخطاء التحقق: ${errorMessages}`);
        } else {
          console.error('❌ General 400 Error:', error.response?.data);
          toast.error(error.response?.data?.message || 'بيانات غير صحيحة');
        }
      } else if (error.response?.status === 403) {
        toast.error('ليس لديك صلاحية لتنفيذ هذا الإجراء');
      } else if (error.response?.status === 404) {
        toast.error('العميل المحتمل غير موجود');
      } else {
        toast.error(error.response?.data?.message || 'حدث خطأ في الحفظ');
      }
      
      // Don't navigate away on error
    } finally {
      setLoading(false);
      console.log('🏁 LEAD FORM SUBMISSION ENDED');
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ENHANCED DEBUG PANEL FOR LEADS */}
      {isEdit && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">🔍 Lead Debug Information</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Edit Mode:</strong> {isEdit ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>Lead ID:</strong> {id || '❌ Not set'}
            </div>
            <div>
              <strong>Loading:</strong> {isLoading ? '🔄 Yes' : '✅ No'}
            </div>
            <div>
              <strong>Query Error:</strong> {queryError ? '❌ Yes' : '✅ No'}
            </div>
            <div>
              <strong>API Response:</strong> {leadResponse ? '✅ Received' : '❌ Not received'}
            </div>
            <div>
              <strong>Data Loaded:</strong> {dataLoaded ? '✅ Yes' : '❌ No'}
            </div>
            {formData && (
              <div className="col-span-3 mt-2 p-2 bg-white rounded border">
                <strong>📊 Loaded Lead Data Sample:</strong>
                <div className="mt-1 text-xs">
                  <div>Name: {formData.firstName} {formData.lastName}</div>
                  <div>Email: {formData.email}</div>
                  <div>Company: {formData.companyName}</div>
                  <div>Status: {formData.status}</div>
                  <div>Priority: {formData.priority}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔧 MANUAL LEAD FORM POPULATION TRIGGERED');
                    if (leadResponse) {
                      processLeadData(leadResponse);
                    } else if (formData) {
                      Object.keys(formData).forEach(key => {
                        setValue(key, formData[key]);
                        console.log(`🔧 Manual setValue(${key}, "${formData[key]}")`);
                      });
                      toast.info('تم تحديث نموذج العميل المحتمل يدوياً');
                    } else {
                      toast.error('لا توجد بيانات للتحديث');
                    }
                  }}
                  className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  🔧 Force Lead Form Update
                </button>
              </div>
            )}
            
            {leadResponse && !dataLoaded && (
              <div className="col-span-3 mt-2 p-2 bg-red-50 rounded border border-red-200">
                <strong className="text-red-800">⚠️ Lead data received but not processed!</strong>
                <div className="text-xs text-red-600 mt-1">
                  Check console for processing errors
                </div>
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔍 MANUAL LEAD DEBUG INSPECTION:');
                    console.log('📊 leadResponse:', leadResponse);
                    console.log('📊 leadResponse.data:', leadResponse.data);
                    console.log('📊 Type of leadResponse:', typeof leadResponse);
                    console.log('📊 Keys in leadResponse:', Object.keys(leadResponse || {}));
                    
                    if (leadResponse && leadResponse.data) {
                      console.log('📊 Keys in leadResponse.data:', Object.keys(leadResponse.data));
                      console.log('📊 leadResponse.data._id:', leadResponse.data._id);
                      console.log('📊 leadResponse.data.success:', leadResponse.data.success);
                      console.log('📊 leadResponse.data.data:', leadResponse.data.data);
                    }
                    
                    // Try to process it manually
                    processLeadData(leadResponse);
                  }}
                  className="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                >
                  🔍 Debug & Process Lead Data
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
              onClick={() => navigate('/leads')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {isEdit ? 'تعديل العميل المحتمل' : 'إضافة عميل محتمل جديد'}
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
                    required: 'الاسم الأخير مطلوب'
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
                  placeholder="اسم شركة العميل المحتمل"
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
                <label className="label">مصدر العميل المحتمل</label>
                <select {...register('source')} className="input">
                  <option value="website">الموقع الإلكتروني</option>
                  <option value="referral">إحالة</option>
                  <option value="social_media">وسائل التواصل الاجتماعي</option>
                  <option value="email_campaign">حملة بريد إلكتروني</option>
                  <option value="cold_call">اتصال بارد</option>
                  <option value="trade_show">معرض تجاري</option>
                  <option value="advertisement">إعلان</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lead Status & Priority */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">حالة العميل المحتمل</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="label">الحالة</label>
                <select {...register('status')} className="input">
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
                <label className="label">الأولوية</label>
                <select {...register('priority')} className="input">
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                  <option value="urgent">عاجلة</option>
                </select>
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
                <label className="label">تاريخ الإغلاق المتوقع</label>
                <input
                  {...register('expectedCloseDate')}
                  type="date"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">المعلومات المالية</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="label">القيمة المتوقعة</label>
                <input
                  {...register('estimatedValue', {
                    min: { value: 0, message: 'القيمة يجب أن تكون أكبر من الصفر' }
                  })}
                  type="number"
                  className={`input ${errors.estimatedValue ? 'input-error' : ''}`}
                  placeholder="0"
                />
                {errors.estimatedValue && (
                  <p className="mt-1 text-sm text-red-600">{errors.estimatedValue.message}</p>
                )}
              </div>

              <div>
                <label className="label">احتمالية النجاح (%)</label>
                <input
                  {...register('probability', {
                    min: { value: 0, message: 'الاحتمالية يجب أن تكون بين 0 و 100' },
                    max: { value: 100, message: 'الاحتمالية يجب أن تكون بين 0 و 100' }
                  })}
                  type="number"
                  className={`input ${errors.probability ? 'input-error' : ''}`}
                  placeholder="50"
                  min="0"
                  max="100"
                />
                {errors.probability && (
                  <p className="mt-1 text-sm text-red-600">{errors.probability.message}</p>
                )}
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
              onClick={() => navigate('/leads')}
            >
              إلغاء
            </Button>
            
            {/* Debug Submit Button for Leads */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const currentFormData = getValues();
                console.log('🔍 CURRENT LEAD FORM VALUES:', currentFormData);
                console.log('🔧 Testing lead manual submit...');
                
                // Check for common validation issues
                console.log('📊 Form Validation Check:');
                console.log('- firstName:', currentFormData.firstName);
                console.log('- lastName:', currentFormData.lastName);
                console.log('- email:', currentFormData.email);
                console.log('- estimatedValue:', currentFormData.estimatedValue, typeof currentFormData.estimatedValue);
                console.log('- probability:', currentFormData.probability, typeof currentFormData.probability);
                
                handleSubmit(onSubmit)();
              }}
              className="bg-yellow-100 text-yellow-800 border-yellow-300"
            >
              🧪 Test Lead Save
            </Button>
            
            <Button
              type="submit"
              loading={loading}
            >
              {isEdit ? 'تحديث العميل المحتمل' : 'إضافة العميل المحتمل'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadForm;