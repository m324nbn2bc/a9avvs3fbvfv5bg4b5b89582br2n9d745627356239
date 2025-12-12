"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import CampaignModerationCard from "@/components/admin/CampaignModerationCard";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function AdminCampaignsPage() {
  return (
    <ErrorBoundary>
      <AdminCampaignsContent />
    </ErrorBoundary>
  );
}

function AdminCampaignsContent() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    moderationStatus: 'all',
    sortBy: 'createdAt',
    limit: 10,
  });

  const fetchCampaigns = async (isLoadMore = false) => {
    if (!user) return;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const token = await user.getIdToken();
      
      const params = new URLSearchParams();
      if (filters.moderationStatus !== 'all') {
        params.append('moderationStatus', filters.moderationStatus);
      }
      params.append('sortBy', filters.sortBy);
      params.append('limit', filters.limit.toString());
      
      const response = await fetch(`/api/admin/campaigns?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      const newCampaigns = data.data || [];
      setCampaigns(newCampaigns);
      setHasMore(newCampaigns.length === filters.limit);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    setFilters(prev => ({ ...prev, limit: prev.limit + 10 }));
    setTimeout(() => fetchCampaigns(true), 0);
  };

  const handleCampaignUpdate = (updatedCampaign, deleted = false) => {
    if (deleted) {
      setCampaigns(prevCampaigns =>
        prevCampaigns.filter(campaign => campaign.id !== updatedCampaign?.id)
      );
      fetchCampaigns();
    } else {
      setCampaigns(prevCampaigns =>
        prevCampaigns.map(campaign =>
          campaign.id === updatedCampaign.id ? { ...campaign, ...updatedCampaign } : campaign
        )
      );
      fetchCampaigns();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Load Campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Moderation Status
            </label>
            <select
              id="status-filter"
              value={filters.moderationStatus}
              onChange={(e) => setFilters({ ...filters, moderationStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
            >
              <option value="all" className="text-gray-900">All Statuses</option>
              <option value="active" className="text-gray-900">Active</option>
              <option value="under-review-hidden" className="text-gray-900">Under Review (Hidden)</option>
              <option value="removed-temporary" className="text-gray-900">Removed (Temporary)</option>
              <option value="removed-permanent" className="text-gray-900">Removed (Permanent)</option>
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
              <option value="createdAt" className="text-gray-900">Most Recent</option>
              <option value="reports" className="text-gray-900">Most Reports</option>
              <option value="supporters" className="text-gray-900">Most Supports</option>
            </select>
          </div>

          <div>
            <label htmlFor="limit-input" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Campaigns
            </label>
            <input
              id="limit-input"
              type="number"
              min="1"
              max="500"
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) || 10 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
              placeholder="10"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchCampaigns}
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
                'Load Campaigns'
              )}
            </button>
          </div>
        </div>
        {campaigns.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing <span className="font-semibold">{campaigns.length}</span> campaign{campaigns.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <p className="mt-2 text-gray-600">Loading campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
          <p className="mt-1 text-sm text-gray-500">No campaigns match your current filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignModerationCard
                key={campaign.id}
                campaign={campaign}
                onUpdate={handleCampaignUpdate}
              />
            ))}
          </div>
          
          {hasMore && !loading && (
            <div className="bg-white rounded-lg shadow p-6 text-center mt-6">
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
        </>
      )}
    </div>
  );
}
