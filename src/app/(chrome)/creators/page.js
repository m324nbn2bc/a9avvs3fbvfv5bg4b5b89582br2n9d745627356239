"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getTopCreators } from '../../../lib/firestore';
import { getProfileAvatar } from '../../../utils/imageTransform';
import LoadingSpinner from '../../../components/LoadingSpinner';
import FilterModal from '../../../components/FilterModal';

export default function CreatorsPage() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    country: null,
    timePeriod: 'all'
  });

  const loadCreators = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTopCreators(filters);
      setCreators(result);
    } catch (error) {
      console.error('Error loading creators:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCreators();
  }, [loadCreators]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const filterFields = [
    {
      key: 'timePeriod',
      label: 'Time Period',
      options: [
        { value: 'all', label: 'All Time' },
        { value: '24h', label: 'Last 24 Hours' },
        { value: '7d', label: 'Last 7 Days' },
        { value: '30d', label: 'Last 30 Days' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen flex">
        <div className="flex-1 w-full flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-16 xl:px-20 pt-20">
          <div className="mx-auto w-full max-w-6xl">
            {/* Header */}
            <div className="text-center mb-8 bg-yellow-400 px-6 py-6 rounded-t-xl">
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700">Top Creators</h1>
              <p className="text-base sm:text-lg text-gray-700 mt-2">Discover creators with the most supported campaigns</p>
            </div>
            
            {/* Content Card with Shadow Border */}
            <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 px-6 py-8 shadow-sm">
              {/* Filter Button */}
              <div className="mb-6 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-emerald-600 text-lg">{creators.length}</span>
                  <span className="ml-1">creators found</span>
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

              {/* Creators List */}
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <LoadingSpinner size="lg" />
                </div>
              ) : creators.length === 0 ? (
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No creators found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your filters or check back later</p>
                  <Link
                    href="/create"
                    className="btn-base btn-primary inline-block px-6 py-3 font-medium"
                  >
                    Become a Creator
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Table Header */}
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 sm:px-6 py-4">
                    <div className="grid grid-cols-12 gap-3 sm:gap-4 text-emerald-50 font-semibold text-sm">
                      <div className="col-span-2 sm:col-span-1">Rank</div>
                      <div className="col-span-6 sm:col-span-8">Creator</div>
                      <div className="col-span-4 sm:col-span-3 text-center">Supports</div>
                    </div>
                  </div>

                  {/* Creators List */}
                  <div className="divide-y divide-gray-200">
                    {creators.map((creator, index) => (
                      <Link
                        key={creator.id}
                        href={`/u/${creator.username}`}
                        className="block px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center">
                          {/* Rank */}
                          <div className="col-span-2 sm:col-span-1">
                            <div className={`flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-gray-100 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-emerald-50 text-emerald-700'
                            }`}>
                              {index + 1}
                            </div>
                          </div>

                          {/* Creator Info */}
                          <div className="col-span-6 sm:col-span-8 flex items-center gap-2 min-w-0">
                            {/* Profile Image */}
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                              {creator.profileImage ? (
                                <img
                                  src={getProfileAvatar(creator.profileImage)}
                                  alt={creator.displayName}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-white text-base font-bold">
                                  {creator.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              )}
                            </div>
                            
                            {/* Name and Username */}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {creator.displayName}
                              </h3>
                              <p className="text-sm text-emerald-600 truncate">
                                @{creator.username}
                              </p>
                            </div>
                          </div>

                          {/* Total Supports */}
                          <div className="col-span-4 sm:col-span-3 text-center">
                            <div className="font-bold text-emerald-600 text-lg">
                              {creator.totalSupports || 0}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Card */}
              <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-900 mb-1">How are creators ranked?</h3>
                    <p className="text-sm text-emerald-800 leading-relaxed">
                      Creators are ranked by their total supports (downloads) across all campaigns. The more people use your campaigns, the higher you'll rank. Create amazing frames and backgrounds to climb the leaderboard!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
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
