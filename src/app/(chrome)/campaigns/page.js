"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getAllCampaigns } from '../../../lib/firestore';
import LoadingSpinner from '../../../components/LoadingSpinner';
import FilterModal from '../../../components/FilterModal';
import CampaignGallery from '../../../components/CampaignGallery';
import Pagination from '../../../components/Pagination';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const [filters, setFilters] = useState({
    type: 'all',
    country: null,
    timePeriod: 'all',
    sortBy: 'createdAt'
  });

  const loadCampaigns = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await getAllCampaigns({ ...filters, page, pageSize: 10 });
      setCampaigns(result.campaigns);
      setCurrentPage(result.currentPage);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setCurrentPage(1);
    loadCampaigns(1);
  }, [filters]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadCampaigns(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filterFields = [
    {
      key: 'type',
      label: 'Type',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'frame', label: 'Frames Only' },
        { value: 'background', label: 'Backgrounds Only' }
      ]
    },
    {
      key: 'timePeriod',
      label: 'Time Period',
      options: [
        { value: 'all', label: 'All Time' },
        { value: '24h', label: 'Last 24 Hours' },
        { value: '7d', label: 'Last 7 Days' },
        { value: '30d', label: 'Last 30 Days' }
      ]
    },
    {
      key: 'sortBy',
      label: 'Sort By',
      options: [
        { value: 'createdAt', label: 'Most Recent' },
        { value: 'supportersCount', label: 'Most Popular' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen flex">
        <div className="flex-1 w-full flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-16 xl:px-20 pt-20">
          <div className="mx-auto w-full max-w-6xl">
            <div className="text-center mb-8 bg-yellow-400 px-6 py-6 rounded-t-xl">
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700">Discover Campaigns</h1>
              <p className="text-base sm:text-lg text-gray-700 mt-2">Browse and use thousands of frames and backgrounds created by the community</p>
            </div>
            
            <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 px-6 py-8 shadow-sm">
              <div className="mb-6 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-emerald-600 text-lg">{totalCount}</span>
                  <span className="ml-1">campaigns found</span>
                  {totalPages > 1 && (
                    <span className="ml-2 text-gray-400">
                      (Page {currentPage} of {totalPages})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsFilterModalOpen(true)}
                  className="btn-base btn-secondary px-4 py-2 text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <LoadingSpinner size="lg" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-200">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your filters or check back later</p>
                  <Link
                    href="/create"
                    className="btn-base btn-primary inline-block px-6 py-3 font-medium"
                  >
                    Create First Campaign
                  </Link>
                </div>
              ) : (
                <>
                  <CampaignGallery
                    campaigns={campaigns}
                    loading={false}
                    showCreatorInfo={true}
                    showReportOption={true}
                  />
                  
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
        filterFields={filterFields}
      />
    </div>
  );
}
