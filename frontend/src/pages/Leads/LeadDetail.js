import React, { useState } from 'react';
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
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { leadsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Fetch lead data
  const { data: lead, isLoading, error } = useQuery(
    ['lead', id],
    () => leadsAPI.getLead(id),
    {
      select: (response) => response.data.data
    }
  );

  // Add note mutation
  const addNoteMutation = useMutation(
    (noteData) => leadsAPI.addNote(id, noteData),
    {
      onSuccess: () => {
        toast.success('تم إضافة الملاحظة بنجاح');
        setNewNote('');
        queryClient.invalidateQueries(['lead', id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'حدث خطأ في إضافة الملاحظة');
      }
    }
  );

  // Convert to client mutation
  const convertMutation = useMutation(
    () => leadsAPI.convertToClient(id),
    {
      onSuccess: () => {
        toast.success('تم تحويل العميل المحتمل إلى عميل بنجاح');
        queryClient.invalidateQueries(['lead', id]);
        queryClient.invalidateQueries(['leads']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'حدث خطأ في التحويل');
      }
    }
  );

  // Delete lead mutation
  const deleteMutation = useMutation(
    () => leadsAPI.deleteLead(id),
    {
      onSuccess: () => {
        toast.success('تم حذف العميل المحتمل بنجاح');
        navigate('/leads');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'حدث خطأ في الحذف');
      }
    }
  );

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    try {
      await addNoteMutation.mutateAsync({
        content: newNote,
        isPrivate: false
      });
    } finally {
      setAddingNote(false);
    }
  };

  const handleConvert = () => {
    if (window.confirm(`هل تريد تحويل "${lead?.firstName} ${lead?.lastName}" إلى عميل؟`)) {
      convertMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف العميل المحتمل "${lead?.firstName} ${lead?.lastName}"؟`)) {
      deleteMutation.mutate();
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
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
          {error.response?.data?.message || 'حدث خطأ في تحميل بيانات العميل المحتمل'}
        </p>
        <div className="mt-4">
          <Button onClick={() => navigate('/leads')}>
            العودة للقائمة
          </Button>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">العميل المحتمل غير موجود</h3>
        <div className="mt-4">
          <Button onClick={() => navigate('/leads')}>
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
              onClick={() => navigate('/leads')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {lead.firstName} {lead.lastName}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {lead.jobTitle} في {lead.companyName}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          {hasPermission('update_leads') && (
            <Link to={`/leads/${id}/edit`}>
              <Button icon={PencilIcon} variant="outline">
                تعديل البيانات
              </Button>
            </Link>
          )}
          {hasPermission('create_clients') && !lead.convertedToClient && (
            <Button 
              icon={ArrowPathIcon} 
              variant="primary"
              onClick={handleConvert}
              loading={convertMutation.isLoading}
            >
              تحويل إلى عميل
            </Button>
          )}
          {hasPermission('delete_leads') && (
            <Button 
              icon={TrashIcon} 
              variant="danger"
              onClick={handleDelete}
              loading={deleteMutation.isLoading}
            >
              حذف
            </Button>
          )}
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
                  <label className="label">الاسم الكامل</label>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-sm">
                          {lead.firstName[0]}{lead.lastName[0]}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {lead.firstName} {lead.lastName}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">الحالة</label>
                  <div>{getStatusBadge(lead.status)}</div>
                </div>

                <div>
                  <label className="label">الأولوية</label>
                  <div>{getPriorityBadge(lead.priority)}</div>
                </div>

                <div>
                  <label className="label">البريد الإلكتروني</label>
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <a href={`mailto:${lead.email}`} className="text-primary-600 hover:text-primary-700">
                      {lead.email}
                    </a>
                  </div>
                </div>

                <div>
                  <label className="label">رقم الهاتف</label>
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <a href={`tel:${lead.phone}`} className="text-primary-600 hover:text-primary-700">
                      {lead.phone || '-'}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">معلومات الشركة</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="label">اسم الشركة</label>
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{lead.companyName || '-'}</span>
                  </div>
                </div>

                <div>
                  <label className="label">المسمى الوظيفي</label>
                  <span className="text-sm text-gray-900">{lead.jobTitle || '-'}</span>
                </div>

                <div>
                  <label className="label">الصناعة</label>
                  <span className="text-sm text-gray-900">{lead.industry || '-'}</span>
                </div>

                <div>
                  <label className="label">مصدر العميل المحتمل</label>
                  <span className="text-sm text-gray-900">
                    {lead.source === 'website' && 'الموقع الإلكتروني'}
                    {lead.source === 'referral' && 'إحالة'}
                    {lead.source === 'social_media' && 'وسائل التواصل الاجتماعي'}
                    {lead.source === 'email_campaign' && 'حملة بريد إلكتروني'}
                    {lead.source === 'cold_call' && 'اتصال بارد'}
                    {lead.source === 'trade_show' && 'معرض تجاري'}
                    {lead.source === 'advertisement' && 'إعلان'}
                    {lead.source === 'other' && 'أخرى'}
                    {!lead.source && '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">المعلومات المالية</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label className="label">القيمة المتوقعة</label>
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(lead.estimatedValue, lead.currency)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="label">احتمالية النجاح</label>
                  <div className="flex items-center">
                    <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-lg font-semibold text-gray-900">
                      {lead.probability}%
                    </span>
                  </div>
                </div>

                <div>
                  <label className="label">القيمة المرجحة</label>
                  <span className="text-lg font-semibold text-green-600">
                    {formatCurrency((lead.estimatedValue * lead.probability) / 100, lead.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          {lead.address && (lead.address.street || lead.address.city) && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">العنوان</h3>
              </div>
              <div className="card-body">
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div className="text-sm text-gray-900">
                    {lead.address.street && <div>{lead.address.street}</div>}
                    <div>
                      {[lead.address.city, lead.address.state, lead.address.zipCode]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                    {lead.address.country && <div>{lead.address.country}</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">الملاحظات</h3>
            </div>
            <div className="card-body space-y-4">
              {/* Add new note */}
              {hasPermission('update_leads') && (
                <div className="border-b border-gray-200 pb-4">
                  <textarea
                    className="input resize-none"
                    rows="3"
                    placeholder="إضافة ملاحظة جديدة..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      onClick={handleAddNote}
                      loading={addingNote}
                      disabled={!newNote.trim()}
                      size="sm"
                    >
                      إضافة ملاحظة
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing notes */}
              <div className="space-y-3">
                {lead.notes && lead.notes.length > 0 ? (
                  lead.notes.map((note, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{note.content}</p>
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                            <span>
                              {note.createdBy?.firstName} {note.createdBy?.lastName} • 
                              {formatDate(note.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    لا توجد ملاحظات بعد
                  </p>
                )}
              </div>
            </div>
          </div>
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
                <span className="text-sm text-gray-500">تاريخ الإغلاق المتوقع</span>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-900">
                    {formatDate(lead.expectedCloseDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">تاريخ الإضافة</span>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-900">
                    {formatDate(lead.createdAt)}
                  </span>
                </div>
              </div>

              {lead.lastContact && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">آخر تواصل</span>
                  <span className="text-sm text-gray-900">
                    {formatDate(lead.lastContact)}
                  </span>
                </div>
              )}

              {lead.assignedTo && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">مسؤول الحساب</span>
                  <span className="text-sm text-gray-900">
                    {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                  </span>
                </div>
              )}

              {lead.convertedToClient && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ArrowPathIcon className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        تم التحويل إلى عميل
                      </p>
                      <p className="text-sm text-green-600">
                        {formatDate(lead.convertedDate)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">العلامات</h3>
              </div>
              <div className="card-body">
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag, index) => (
                    <Badge key={index} variant="gray">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">الإجراءات</h3>
            </div>
            <div className="card-body space-y-3">
              {hasPermission('update_leads') && (
                <Link to={`/leads/${id}/edit`} className="block">
                  <Button icon={PencilIcon} variant="outline" className="w-full">
                    تعديل البيانات
                  </Button>
                </Link>
              )}
              
              <Button
                onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                variant="outline"
                className="w-full"
                icon={EnvelopeIcon}
              >
                إرسال بريد إلكتروني
              </Button>

              <Button
                onClick={() => window.open(`tel:${lead.phone}`, '_blank')}
                variant="outline" 
                className="w-full"
                icon={PhoneIcon}
                disabled={!lead.phone}
              >
                اتصال هاتفي
              </Button>

              {hasPermission('create_clients') && !lead.convertedToClient && (
                <Button
                  icon={ArrowPathIcon}
                  variant="primary"
                  onClick={handleConvert}
                  loading={convertMutation.isLoading}
                  className="w-full"
                >
                  تحويل إلى عميل
                </Button>
              )}

              {hasPermission('delete_leads') && (
                <Button
                  icon={TrashIcon}
                  variant="danger"
                  onClick={handleDelete}
                  loading={deleteMutation.isLoading}
                  className="w-full"
                >
                  حذف العميل المحتمل
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;