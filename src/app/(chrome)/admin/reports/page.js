"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import GroupedReportsTable from "@/components/admin/GroupedReportsTable";
import ReportDetailsPanel from "@/components/admin/ReportDetailsPanel";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function AdminReportsPage() {
  return (
    <ErrorBoundary>
      <AdminReportsContent />
    </ErrorBoundary>
  );
}

function AdminReportsContent() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [filters, setFilters] = useState({
    targetType: 'all',
    status: 'pending',
    sortBy: 'reportsCount',
    limit: 10,
  });

  const fetchGroupedReports = async (isLoadMore = false) => {
    if (!user) return;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const token = await user.getIdToken();
      
      const params = new URLSearchParams();
      if (filters.targetType !== 'all') params.append('targetType', filters.targetType);
      if (filters.status !== 'all') params.append('status', filters.status);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', 'desc');
      params.append('limit', filters.limit.toString());
      
      const response = await fetch(`/api/admin/reports/grouped?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch grouped reports');
      }

      const data = await response.json();
      const newSummaries = data.data || [];
      setSummaries(newSummaries);
      setHasMore(newSummaries.length === filters.limit);
    } catch (error) {
      console.error('Error fetching grouped reports:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    setFilters(prev => ({ ...prev, limit: prev.limit + 10 }));
    setTimeout(() => fetchGroupedReports(true), 0);
  };

  const handleSelectSummary = (summary) => {
    setSelectedSummary(summary);
  };

  const handleClosePanel = () => {
    setSelectedSummary(null);
  };

  const handleActionComplete = () => {
    setSelectedSummary(null);
    fetchGroupedReports(); // Refresh to show next batch
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Load Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              id="type-filter"
              value={filters.targetType}
              onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
            >
              <option value="all" className="text-gray-900">All Types</option>
              <option value="campaign" className="text-gray-900">Campaigns</option>
              <option value="user" className="text-gray-900">Users</option>
            </select>
          </div>

          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
            >
              <option value="all" className="text-gray-900">All</option>
              <option value="pending" className="text-gray-900">Pending</option>
              <option value="resolved" className="text-gray-900">Resolved</option>
              <option value="dismissed" className="text-gray-900">Dismissed</option>
            </select>
          </div>

          <div>
            <label htmlFor="sort-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              id="sort-filter"
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
            >
              <option value="lastReportedAt" className="text-gray-900">Most Recent</option>
              <option value="reportsCount" className="text-gray-900">Top Reported</option>
              <option value="firstReportedAt" className="text-gray-900">Oldest Pending</option>
            </select>
          </div>

          <div>
            <label htmlFor="limit-input" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Reports
            </label>
            <input
              id="limit-input"
              type="number"
              min="1"
              max="100"
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) || 10 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
              placeholder="10"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchGroupedReports}
              disabled={loading || !user}
              className="w-full px-6 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                'Load Reports'
              )}
            </button>
          </div>
        </div>
        {summaries.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing <span className="font-semibold">{summaries.length}</span> report{summaries.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <GroupedReportsTable
        summaries={summaries}
        loading={loading}
        onSelectSummary={handleSelectSummary}
        onRefresh={fetchGroupedReports}
      />

      {summaries.length > 0 && hasMore && !loading && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-8 py-3 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loadingMore ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading More...
              </span>
            ) : (
              'Load More (10 items)'
            )}
          </button>
        </div>
      )}

      {selectedSummary && (
        <ReportDetailsPanel
          report={selectedSummary}
          onClose={handleClosePanel}
          onUpdate={handleActionComplete}
          isGrouped={true}
        />
      )}
    </div>
  );
}
