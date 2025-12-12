"use client";

import { formatDistanceToNow } from 'date-fns';

export default function AdminLogsTable({ logs, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <svg className="animate-spin h-10 w-10 mx-auto text-emerald-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Loading admin logs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No admin logs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Click "Load Logs" to fetch admin action history.
          </p>
        </div>
      </div>
    );
  }

  const getActionBadge = (action) => {
    const badges = {
      dismissed: 'bg-gray-100 text-gray-800',
      warned: 'bg-yellow-100 text-yellow-800',
      removed: 'bg-red-100 text-red-800',
    };
    return badges[action] || 'bg-gray-100 text-gray-800';
  };

  const getTargetTypeBadge = (targetType) => {
    const badges = {
      campaign: 'bg-blue-100 text-blue-800',
      user: 'bg-purple-100 text-purple-800',
    };
    return badges[targetType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admin
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reports Count
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    <span className="font-medium">{log.adminName}</span>
                    <span className="text-xs text-gray-500">{log.adminEmail}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionBadge(log.action)}`}>
                    {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTargetTypeBadge(log.targetType)}`}>
                        {log.targetType.charAt(0).toUpperCase() + log.targetType.slice(1)}
                      </span>
                      <span className="font-medium truncate max-w-xs" title={log.targetTitle}>
                        {log.targetTitle}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono mt-1">ID: {log.targetId.substring(0, 12)}...</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <span className="line-clamp-2" title={log.reason}>
                    {log.reason || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    <span className="font-semibold text-emerald-600">
                      {log.additionalData?.reportsCount || 0}
                    </span>
                    {log.additionalData?.previousStatus && (
                      <span className="text-xs text-gray-500">
                        From: {log.additionalData.previousStatus}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
