import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from 'react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { companiesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import toast from 'react-hot-toast';

const CompanyForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  // Get company data for editing
  const { isLoading } = useQuery(
    ['company', id],
    () => companiesAPI.getCompany(id),
    {
      enabled: isEdit,
      onSuccess: (response) => {
        console.log('✅ Company data loaded successfully:', response.data);
        // Backend returns company data directly in response.data
        const companyData = response.data;
        // Prepare form data explicitly
        const formData = {
          name: companyData.name || '',
          email: companyData.email || '',
          phone: companyData.phone || '',
          website: companyData.website || '',
          industry: companyData.industry || '',
          plan: companyData.plan || 'starter',
          maxUsers: companyData.maxUsers || 5,
          isActive: companyData.isActive,
          'address.street': companyData.address?.street || '',
          'address.city': companyData.address?.city || '',
          'address.state': companyData.address?.state || '',
          'address.zipCode': companyData.address?.zipCode || '',
          'address.country': companyData.address?.country || '',
          'settings.timezone': companyData.settings?.timezone || 'UTC',
          'settings.currency': companyData.settings?.currency || 'USD',
          'settings.dateFormat': companyData.settings?.dateFormat || 'MM/DD/YYYY',
        };
        console.log('Company form data prepared:', formData);
        reset(formData);
      },
      onError: (error) => {
        console.error('Error loading company:', error);
        toast.error('حدث خطأ في تحميل بيانات الشركة');
      }
    }
  );

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Restructure nested data
      const formattedData = {
        ...data,
        address: {
          street: data['address.street'] || '',
          city: data['address.city'] || '',
          state: data['address.state'] || '',
          zipCode: data['address.zipCode'] || '',
          country: data['address.country'] || '',
        },
        settings: {
          timezone: data['settings.timezone'] || 'UTC',
          currency: data['settings.currency'] || 'USD',
          dateFormat: data['settings.dateFormat'] || 'MM/DD/YYYY',
        }
      };

      // Remove the flattened fields
      delete formattedData['address.street'];
      delete formattedData['address.city'];
      delete formattedData['address.state'];
      delete formattedData['address.zipCode'];
      delete formattedData['address.country'];
      delete formattedData['settings.timezone'];
      delete formattedData['settings.currency'];
      delete formattedData['settings.dateFormat'];

      // Convert string booleans to actual booleans
      if (typeof formattedData.isActive === 'string') {
        formattedData.isActive = formattedData.isActive === 'true';
      }
      
      if (isEdit) {
        await companiesAPI.updateCompany(id, formattedData);
        toast.success('تم تحديث الشركة بنجاح');
      } else {
        await companiesAPI.createCompany(formattedData);
        toast.success('تم إضافة الشركة بنجاح');
      }
      
      navigate('/companies');
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin()) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">غير مصرح</h3>
        <p className="mt-2 text-sm text-gray-500">
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

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {isEdit ? 'تعديل الشركة' : 'إضافة شركة جديدة'}
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
                <label className="label">اسم الشركة *</label>
                <input
                  {...register('name', {
                    required: 'اسم الشركة مطلوب',
                    minLength: { value: 2, message: 'اسم الشركة يجب أن يكون أطول من حرفين' }
                  })}
                  type="text"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="أدخل اسم الشركة"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
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
                  placeholder="company@example.com"
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
                  placeholder="+966 11 123 4567"
                />
              </div>

              <div>
                <label className="label">الموقع الإلكتروني</label>
                <input
                  {...register('website')}
                  type="url"
                  className="input"
                  placeholder="https://company.com"
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
                  <option value="marketing">تسويق</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div>
                <label className="label">الخطة</label>
                <select {...register('plan')} className="input">
                  <option value="starter">مبتدئ - $10/مستخدم/شهر</option>
                  <option value="professional">احترافي - $25/مستخدم/شهر</option>
                  <option value="enterprise">مؤسسي - $50/مستخدم/شهر</option>
                </select>
              </div>

              <div>
                <label className="label">الحد الأقصى للمستخدمين</label>
                <input
                  {...register('maxUsers', {
                    min: { value: 1, message: 'يجب أن يكون العدد أكبر من الصفر' }
                  })}
                  type="number"
                  className={`input ${errors.maxUsers ? 'input-error' : ''}`}
                  placeholder="25"
                  min="1"
                />
                {errors.maxUsers && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxUsers.message}</p>
                )}
              </div>

              <div>
                <label className="label">حالة الشركة</label>
                <select {...register('isActive')} className="input">
                  <option value={true}>نشطة</option>
                  <option value={false}>غير نشطة</option>
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

          {/* Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">الإعدادات</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="label">المنطقة الزمنية</label>
                <select {...register('settings.timezone')} className="input">
                  <option value="UTC">UTC</option>
                  <option value="Asia/Riyadh">الرياض</option>
                  <option value="Asia/Dubai">دبي</option>
                  <option value="Africa/Cairo">القاهرة</option>
                  <option value="America/New_York">نيويورك</option>
                  <option value="Europe/London">لندن</option>
                </select>
              </div>

              <div>
                <label className="label">العملة</label>
                <select {...register('settings.currency')} className="input">
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="AED">درهم إماراتي (AED)</option>
                  <option value="EUR">يورو (EUR)</option>
                </select>
              </div>

              <div>
                <label className="label">تنسيق التاريخ</label>
                <select {...register('settings.dateFormat')} className="input">
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/companies')}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              {isEdit ? 'تحديث الشركة' : 'إضافة الشركة'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyForm;