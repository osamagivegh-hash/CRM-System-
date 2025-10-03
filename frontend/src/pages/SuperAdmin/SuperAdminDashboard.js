import React, { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await superAdminAPI.getDashboardStats();
      setStats(response.data.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;
  if (!stats) return <div className="text-gray-500 text-center py-8">No data available</div>;

  const { overview, planDistribution, recentTenants } = stats;

  const overviewCards = [
    {
      title: 'Total Tenants',
      value: overview.totalTenants,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500',
      change: null
    },
    {
      title: 'Active Tenants',
      value: overview.activeTenants,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      change: null
    },
    {
      title: 'Trial Tenants',
      value: overview.trialTenants,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      change: null
    },
    {
      title: 'Suspended',
      value: overview.suspendedTenants,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      change: null
    },
    {
      title: 'Total Users',
      value: overview.totalUsers,
      icon: UserGroupIcon,
      color: 'bg-indigo-500',
      change: null
    },
    {
      title: 'Monthly Revenue',
      value: `$${overview.monthlyRevenue?.toLocaleString() || 0}`,
      icon: CurrencyDollarIcon,
      color: 'bg-emerald-500',
      change: null
    }
  ];

  const getPlanColor = (plan) => {
    const colors = {
      trial: 'bg-gray-100 text-gray-800',
      starter: 'bg-blue-100 text-blue-800',
      professional: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-emerald-100 text-emerald-800'
    };
    return colors[plan] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      trial_expired: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Super Admin Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage all tenants across the platform
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={fetchDashboardStats}
            className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ChartBarIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {overviewCards.map((card, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`inline-flex items-center justify-center p-3 ${card.color} rounded-md`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.title}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {card.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Plan Distribution
            </h3>
            <div className="space-y-3">
              {planDistribution.map((plan) => (
                <div key={plan._id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPlanColor(plan._id)}`}>
                      {plan._id}
                    </span>
                  </div>
                  <div className="text-sm text-gray-900 font-medium">
                    {plan.count} tenant{plan.count !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Tenants */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Tenants
            </h3>
            <div className="space-y-3">
              {recentTenants.map((tenant) => (
                <div key={tenant._id} className="flex items-center justify-between py-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {tenant.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {tenant.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {tenant.subdomain}.mycrm.com
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPlanColor(tenant.plan)}`}>
                      {tenant.plan}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(tenant.status)}`}>
                      {tenant.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <BuildingOfficeIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
              Create Tenant
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <UserGroupIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
              View All Tenants
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <ChartBarIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
              Generate Report
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <CurrencyDollarIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
              Revenue Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;




