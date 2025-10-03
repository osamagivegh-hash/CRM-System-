import React from 'react';
import { useQuery } from 'react-query';
import {
  UsersIcon,
  UserGroupIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { dashboardAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Badge from '../../components/UI/Badge';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, loading }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-8 w-8 text-primary-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {trend && (
                  <div className="ml-2 flex items-baseline text-sm font-semibold">
                    {trend === 'up' ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                      {trendValue}
                    </span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, isSuperAdmin } = useAuth();

  const { data: overview, isLoading: overviewLoading } = useQuery(
    ['dashboard-overview'],
    () => dashboardAPI.getOverview(),
    {
      select: (response) => response.data.data,
    }
  );

  const { data: funnel, isLoading: funnelLoading } = useQuery(
    ['dashboard-funnel'],
    () => dashboardAPI.getSalesFunnel(),
    {
      select: (response) => response.data.data,
    }
  );

  const { data: tasks, isLoading: tasksLoading } = useQuery(
    ['dashboard-tasks'],
    () => dashboardAPI.getUpcomingTasks(),
    {
      select: (response) => response.data.data,
    }
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      new: 'info',
      contacted: 'warning',
      qualified: 'primary',
      proposal: 'warning',
      negotiation: 'info',
      closed_won: 'success',
      closed_lost: 'error',
      active: 'success',
      inactive: 'gray',
      potential: 'warning',
      lost: 'error',
    };
    return variants[status] || 'gray';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user?.firstName}! Here's what's happening with your business.
          </p>
        </div>
      </div>

      {/* Company Info (for non-super admin users) */}
      {!isSuperAdmin() && overview?.company && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{overview.company.name}</h3>
                <p className="text-sm text-gray-500">
                  {overview.company.plan.charAt(0).toUpperCase() + overview.company.plan.slice(1)} Plan
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {overview.company.currentUsers} / {overview.company.maxUsers} users
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(overview.company.monthlyPrice)}/month
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={overview?.users?.total || 0}
          icon={UsersIcon}
          loading={overviewLoading}
        />
        <StatCard
          title="Active Clients"
          value={overview?.clients?.active || 0}
          icon={UserGroupIcon}
          loading={overviewLoading}
        />
        <StatCard
          title="Open Leads"
          value={overview?.leads?.open || 0}
          icon={ChartBarIcon}
          loading={overviewLoading}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(overview?.revenue?.total)}
          icon={CurrencyDollarIcon}
          loading={overviewLoading}
        />
      </div>

      {/* Sales Funnel & Recent Activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Sales Funnel */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Sales Funnel</h3>
          </div>
          <div className="card-body">
            {funnelLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-3">
                {funnel?.map((stage) => (
                  <div key={stage.stage} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Badge variant={getStatusBadgeVariant(stage.stage)}>
                        {stage.stage.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="ml-2 text-sm text-gray-600">
                        {stage.count} leads
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(stage.totalValue)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="card-body">
            {overviewLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New clients (30 days)</span>
                  <span className="text-sm font-medium text-gray-900">
                    {overview?.recent?.clients || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New leads (30 days)</span>
                  <span className="text-sm font-medium text-gray-900">
                    {overview?.recent?.leads || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Conversions (30 days)</span>
                  <span className="text-sm font-medium text-gray-900">
                    {overview?.recent?.conversions || 0}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pipeline Value</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(overview?.pipeline?.total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">Weighted Pipeline</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(overview?.pipeline?.weighted)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Upcoming Tasks & Follow-ups</h3>
        </div>
        <div className="card-body">
          {tasksLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-4">
              {/* Overdue items */}
              {(tasks?.overdue?.clients > 0 || tasks?.overdue?.leads > 0) && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <h4 className="text-sm font-medium text-red-900 mb-2">Overdue Items</h4>
                  <div className="space-y-1">
                    {tasks.overdue.clients > 0 && (
                      <p className="text-sm text-red-700">
                        {tasks.overdue.clients} client follow-ups overdue
                      </p>
                    )}
                    {tasks.overdue.leads > 0 && (
                      <p className="text-sm text-red-700">
                        {tasks.overdue.leads} leads past expected close date
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Client follow-ups */}
              {tasks?.clientFollowUps?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Client Follow-ups</h4>
                  <div className="space-y-2">
                    {tasks.clientFollowUps.slice(0, 5).map((client) => (
                      <div key={client._id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {client.firstName} {client.lastName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(client.nextFollowUp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lead activities */}
              {tasks?.leadActivities?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Scheduled Activities</h4>
                  <div className="space-y-2">
                    {tasks.leadActivities.slice(0, 5).map((lead) => (
                      <div key={lead._id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {lead.firstName} {lead.lastName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {lead.activities?.length > 0 && 
                            new Date(lead.activities[0].scheduledDate).toLocaleDateString()
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!tasks?.clientFollowUps?.length && !tasks?.leadActivities?.length && !tasks?.overdue?.clients && !tasks?.overdue?.leads) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No upcoming tasks or follow-ups
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
