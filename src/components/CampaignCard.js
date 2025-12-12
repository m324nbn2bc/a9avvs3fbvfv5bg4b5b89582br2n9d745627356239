"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getCampaignPreview, getProfileAvatar } from '../utils/imageTransform';
import { abbreviateNumber } from '../utils/validation';
import CampaignCardMenu from './CampaignCardMenu';

export default function CampaignCard({
  campaign,
  isOwnProfile = false,
  showReportOption = false,
  showCreatorInfo = false,
  onShare,
  onReport,
  onDelete
}) {
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <div className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col relative">
      <Link href={`/campaign/${campaign.slug}`} className="contents">
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {campaign.imageUrl ? (
            <>
              <Image
                src={getCampaignPreview(campaign.imageUrl)}
                alt={campaign.title}
                fill
                className={`object-cover transition-all duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100 group-hover:scale-105'
                }`}
                onLoadingComplete={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                unoptimized
              />
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
            </>
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

        <div className="p-4 flex-grow">
          <h3 className="text-gray-900 font-semibold text-base truncate mb-2">
            {campaign.title}
          </h3>
          
          {showCreatorInfo && (campaign.creator?.username || campaign.creatorUsername) && (
            <Link
              href={`/u/${campaign.creator?.username || campaign.creatorUsername}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 mb-2 hover:bg-gray-50 -mx-1 px-1 py-1 rounded-md transition-colors duration-150"
            >
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
              <span className="text-sm text-gray-600 truncate hover:text-emerald-600 transition-colors duration-150">
                {campaign.creator?.displayName || campaign.creatorName || 'Anonymous'}
              </span>
            </Link>
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
      </Link>

      <CampaignCardMenu
        campaign={campaign}
        isOwnProfile={isOwnProfile}
        showReportOption={showReportOption}
        onShare={onShare}
        onReport={onReport}
        onDelete={onDelete}
      />
    </div>
  );
}
