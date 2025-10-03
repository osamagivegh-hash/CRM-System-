// 🧪 **DEMO: Always-Visible Action Buttons Solution**

import React from 'react';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const TableLayoutDemo = () => {
  // Test data with extremely long content
  const testData = [
    {
      id: 1,
      name: "محمد عبدالرحمن عبدالله الخطيب المحترم بن علي بن محمد",
      company: "شركة التطوير التقني المتقدم للحلول الرقمية المحدودة والاستشارات التقنية",
      email: "mohammed.abdulrahman.alkhatib@very-long-company-domain-name.com",
      phone: "+966-50-123-4567-890",
      status: "نشط"
    },
    {
      id: 2,
      name: "فاطمة أحمد محمد الزهراني",
      company: "مؤسسة الابتكار",
      email: "fatima@innovation.com",
      phone: "+966-55-987-6543",
      status: "محتمل"
    }
  ];

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell" style={{width: '25%'}}>العميل</th>
              <th className="table-header-cell" style={{width: '25%'}}>الشركة</th>
              <th className="table-header-cell" style={{width: '25%'}}>البريد الإلكتروني</th>
              <th className="table-header-cell" style={{width: '15%'}}>الهاتف</th>
              <th className="table-header-cell" style={{width: '10%'}}>الحالة</th>
              <th className="table-header-cell table-actions" style={{width: '200px', minWidth: '200px'}}>الإجراءات</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {testData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {/* Name Column - Truncated with tooltip */}
                <td className="table-cell-content">
                  <div className="flex items-center min-w-0">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-sm">
                          {item.name[0]}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 min-w-0 flex-1">
                      <div className="text-sm font-medium text-primary-600 truncate" title={item.name}>
                        {item.name}
                      </div>
                    </div>
                  </div>
                </td>
                
                {/* Company Column - Truncated */}
                <td className="table-cell">
                  <div className="text-sm text-gray-900 truncate" title={item.company}>
                    {item.company}
                  </div>
                </td>
                
                {/* Email Column - Truncated */}
                <td className="table-cell">
                  <div className="text-sm text-gray-900 truncate" title={item.email}>
                    {item.email}
                  </div>
                </td>
                
                {/* Phone Column - Truncated */}
                <td className="table-cell">
                  <div className="text-sm text-gray-900 truncate" title={item.phone}>
                    {item.phone}
                  </div>
                </td>
                
                {/* Status Column - Fixed width */}
                <td className="table-cell">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    {item.status}
                  </span>
                </td>
                
                {/* Actions Column - ALWAYS VISIBLE */}
                <td className="table-actions">
                  <div className="flex items-center justify-start gap-1">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs">
                      <EyeIcon className="h-3 w-3 inline mr-1" />
                      عرض
                    </button>
                    <button className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs">
                      <PencilIcon className="h-3 w-3 inline mr-1" />
                      تعديل
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs">
                      <TrashIcon className="h-3 w-3 inline mr-1" />
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableLayoutDemo;











