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
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { clientsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Fetch client data
  const { data: client, isLoading, error } = useQuery(
    ['client', id],
    () => clientsAPI.getClient(id),
    {
      select: (response) => response.data.data
    }
  );

  // Add note mutation
  const addNoteMutation = useMutation(
    (noteData) => clientsAPI.addNote(id, noteData),
    {
      onSuccess: () => {
        toast.success('تم إضافة الملاحظة بنجاح');
        setNewNote('');
        queryClient.invalidateQueries(['client', id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'حدث خطأ في إضافة الملاحظة');
      }
    }
  );

  // Delete client mutation
  const deleteMutation = useMutation(
    () => clientsAPI.deleteClient(id),
    {
      onSuccess: () => {
        toast.success('تم حذف العميل بنجاح');
        navigate('/clients');
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

  const handleDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف العميل "${client?.firstName} ${client?.lastName}"؟`)) {
      deleteMutation.mutate();
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'gray',
      potential: 'warning',
      lost: 'error'
    };
    
    const labels = {
      active: 'نشط',
      inactive: 'غير نشط',
      potential: 'محتمل',
      lost: 'مفقود'
    };

    return (
      <Badge variant={variants[status] || 'gray'}>
        {labels[status] || status}
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
          {error.response?.data?.message || 'حدث خطأ في تحميل بيانات العميل'}
        </p>
        <div className="mt-4">
          <Button onClick={() => navigate('/clients')}>
            العودة للقائمة
          </Button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">العميل غير موجود</h3>
        <div className="mt-4">
          <Button onClick={() => navigate('/clients')}>
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
              onClick={() => navigate('/clients')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {client.firstName} {client.lastName}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {client.jobTitle} في {client.companyName}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          {hasPermission('update_clients') && (
            <Link to={`/clients/${id}/edit`}>
              <Button icon={PencilIcon} variant="outline">
                تعديل البيانات
              </Button>
            </Link>
          )}
          {hasPermission('delete_clients') && (
            <Button 
              icon={TrashIcon} 
              variant="danger"
              onClick={handleDelete}
              loading={deleteMutation.isLoading}
            >
              حذف العميل
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
                          {client.firstName[0]}{client.lastName[0]}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {client.firstName} {client.lastName}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">الحالة</label>
                  <div>{getStatusBadge(client.status)}</div>
                </div>

                <div>
                  <label className="label">البريد الإلكتروني</label>
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <a href={`mailto:${client.email}`} className="text-primary-600 hover:text-primary-700">
                      {client.email}
                    </a>
                  </div>
                </div>

                <div>
                  <label className="label">رقم الهاتف</label>
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <a href={`tel:${client.phone}`} className="text-primary-600 hover:text-primary-700">
                      {client.phone || '-'}
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
                    <span className="text-sm text-gray-900">{client.companyName || '-'}</span>
                  </div>
                </div>

                <div>
                  <label className="label">المسمى الوظيفي</label>
                  <span className="text-sm text-gray-900">{client.jobTitle || '-'}</span>
                </div>

                <div>
                  <label className="label">الصناعة</label>
                  <span className="text-sm text-gray-900">{client.industry || '-'}</span>
                </div>

                <div>
                  <label className="label">مصدر العميل</label>
                  <span className="text-sm text-gray-900">
                    {client.source === 'website' && 'الموقع الإلكتروني'}
                    {client.source === 'referral' && 'إحالة'}
                    {client.source === 'social_media' && 'وسائل التواصل الاجتماعي'}
                    {client.source === 'email_campaign' && 'حملة بريد إلكتروني'}
                    {client.source === 'cold_call' && 'اتصال بارد'}
                    {client.source === 'trade_show' && 'معرض تجاري'}
                    {client.source === 'other' && 'أخرى'}
                    {!client.source && '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          {client.address && (client.address.street || client.address.city) && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">العنوان</h3>
              </div>
              <div className="card-body">
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div className="text-sm text-gray-900">
                    {client.address.street && <div>{client.address.street}</div>}
                    <div>
                      {[client.address.city, client.address.state, client.address.zipCode]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                    {client.address.country && <div>{client.address.country}</div>}
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
              {hasPermission('update_clients') && (
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
                {client.notes && client.notes.length > 0 ? (
                  client.notes.map((note, index) => (
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
                <span className="text-sm text-gray-500">القيمة</span>
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(client.value, client.currency)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">تاريخ الإضافة</span>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-900">
                    {formatDate(client.createdAt)}
                  </span>
                </div>
              </div>

              {client.lastContact && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">آخر تواصل</span>
                  <span className="text-sm text-gray-900">
                    {formatDate(client.lastContact)}
                  </span>
                </div>
              )}

              {client.nextFollowUp && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">المتابعة التالية</span>
                  <span className="text-sm text-gray-900">
                    {formatDate(client.nextFollowUp)}
                  </span>
                </div>
              )}

              {client.assignedTo && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">مسؤول الحساب</span>
                  <span className="text-sm text-gray-900">
                    {client.assignedTo.firstName} {client.assignedTo.lastName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {client.tags && client.tags.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">العلامات</h3>
              </div>
              <div className="card-body">
                <div className="flex flex-wrap gap-2">
                  {client.tags.map((tag, index) => (
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
              {hasPermission('update_clients') && (
                <Link to={`/clients/${id}/edit`} className="block">
                  <Button icon={PencilIcon} variant="outline" className="w-full">
                    تعديل البيانات
                  </Button>
                </Link>
              )}
              
              <Button
                onClick={() => window.open(`mailto:${client.email}`, '_blank')}
                variant="outline"
                className="w-full"
                icon={EnvelopeIcon}
              >
                إرسال بريد إلكتروني
              </Button>

              <Button
                onClick={() => window.open(`tel:${client.phone}`, '_blank')}
                variant="outline" 
                className="w-full"
                icon={PhoneIcon}
                disabled={!client.phone}
              >
                اتصال هاتفي
              </Button>

              {hasPermission('delete_clients') && (
                <Button
                  icon={TrashIcon}
                  variant="danger"
                  onClick={handleDelete}
                  loading={deleteMutation.isLoading}
                  className="w-full"
                >
                  حذف العميل
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
