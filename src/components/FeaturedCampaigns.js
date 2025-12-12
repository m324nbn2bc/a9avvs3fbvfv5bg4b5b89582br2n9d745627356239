"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllCampaigns } from '../lib/firestore';
import { getCampaignPreview, getProfileAvatar } from '../utils/imageTransform';
import { abbreviateNumber } from '../utils/validation';

export default function FeaturedCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const result = await getAllCampaigns({
          sortBy: 'supportersCount',
          pageSize: 4,
          page: 1
        });
        setCampaigns(result.campaigns);
      } catch (error) {
        console.error('Error loading featured campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  if (loading) {
    return (
      <section className="py-12 sm:py-16 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Top Campaigns
            </h2>
            <Link
              href="/campaigns"
              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto lg:overflow-x-visible scrollbar-hide pb-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-48 sm:w-52 lg:flex-1 lg:w-auto">
                <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                <div className="mt-3 h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="mt-2 h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Top Campaigns
          </h2>
          <Link
            href="/campaigns"
            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto lg:overflow-x-visible scrollbar-hide pb-2">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaign/${campaign.slug}`}
              className="flex-shrink-0 w-48 sm:w-52 lg:flex-1 lg:w-auto group"
            >
              <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  {campaign.imageUrl ? (
                    <Image
                      src={getCampaignPreview(campaign.imageUrl)}
                      alt={campaign.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 192px, (max-width: 1024px) 208px, 25vw"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <svg
                        className="h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  {campaign.type && (
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-white/90 text-gray-800 rounded-md shadow-sm backdrop-blur-sm">
                        {campaign.type === 'frame' ? 'Frame' : 'Background'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-gray-900 font-semibold text-base truncate mb-2">
                    {campaign.title}
                  </h3>
                  
                  {(campaign.creator?.username || campaign.creatorUsername) && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                        {(campaign.creator?.profileImage || campaign.creatorAvatar) ? (
                          <img
                            src={getProfileAvatar(campaign.creator?.profileImage || campaign.creatorAvatar)}
                            alt={campaign.creator?.displayName || campaign.creatorName || 'Creator'}
                            className="w-full h-full rounded-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-white text-xs font-bold">
                            {(campaign.creator?.displayName || campaign.creatorName)?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-600 truncate">
                        {campaign.creator?.displayName || campaign.creatorName || 'Anonymous'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <svg
                      className="h-4 w-4 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>{abbreviateNumber(campaign.supportersCount || 0)} {campaign.supportersCount === 1 ? 'support' : 'supports'}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
