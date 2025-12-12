"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTopCreators } from '../lib/firestore';
import { getProfileAvatar } from '../utils/imageTransform';

export default function FeaturedCreators() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCreators = async () => {
      try {
        const result = await getTopCreators({ limit: 3 });
        setCreators(result);
      } catch (error) {
        console.error('Error loading featured creators:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCreators();
  }, []);

  if (loading) {
    return (
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Top Creators
            </h2>
            <Link
              href="/creators"
              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 sm:px-6 py-4">
              <div className="grid grid-cols-12 gap-3 sm:gap-4 text-emerald-50 font-semibold text-sm">
                <div className="col-span-2 sm:col-span-1">Rank</div>
                <div className="col-span-6 sm:col-span-8">Creator</div>
                <div className="col-span-4 sm:col-span-3 text-center">Supports</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="px-4 sm:px-6 py-4 animate-pulse">
                  <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center">
                    <div className="col-span-2 sm:col-span-1">
                      <div className="w-7 h-7 rounded-full bg-gray-200" />
                    </div>
                    <div className="col-span-6 sm:col-span-8 flex items-center gap-2">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                        <div className="h-3 bg-gray-200 rounded w-16" />
                      </div>
                    </div>
                    <div className="col-span-4 sm:col-span-3 flex justify-center">
                      <div className="h-5 bg-gray-200 rounded w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!creators || creators.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 bg-gray-50">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Top Creators
          </h2>
          <Link
            href="/creators"
            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 sm:px-6 py-4">
            <div className="grid grid-cols-12 gap-3 sm:gap-4 text-emerald-50 font-semibold text-sm">
              <div className="col-span-2 sm:col-span-1">Rank</div>
              <div className="col-span-6 sm:col-span-8">Creator</div>
              <div className="col-span-4 sm:col-span-3 text-center">Supports</div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {creators.map((creator, index) => (
              <Link
                key={creator.id}
                href={`/u/${creator.username}`}
                className="block px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center">
                  <div className="col-span-2 sm:col-span-1">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {index + 1}
                    </div>
                  </div>

                  <div className="col-span-6 sm:col-span-8 flex items-center gap-2 min-w-0">
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
                    
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {creator.displayName}
                      </h3>
                      <p className="text-sm text-emerald-600 truncate">
                        @{creator.username}
                      </p>
                    </div>
                  </div>

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
      </div>
    </section>
  );
}
