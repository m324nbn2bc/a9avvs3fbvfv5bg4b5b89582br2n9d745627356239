"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllCampaigns } from '../lib/firestore';
import CampaignCard from './CampaignCard';
import ShareModal from './ShareModal';
import ReportModal from './ReportModal';

export default function FeaturedCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareModalData, setShareModalData] = useState(null);
  const [reportModalData, setReportModalData] = useState(null);

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

  const handleShare = (campaign) => {
    setShareModalData({
      type: 'campaign',
      title: campaign.title,
      subtitle: campaign.type === 'frame' ? 'Frame' : 'Background',
      url: `${typeof window !== 'undefined' ? window.location.origin : ''}/campaign/${campaign.slug}`,
      image: campaign.imageUrl,
    });
  };

  const handleReport = (campaign) => {
    setReportModalData({
      campaignId: campaign.id,
      campaignSlug: campaign.slug
    });
  };

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

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              showCreatorInfo={true}
              showReportOption={true}
              onShare={() => handleShare(campaign)}
              onReport={() => handleReport(campaign)}
            />
          ))}
        </div>
      </div>

      <ShareModal
        isOpen={!!shareModalData}
        onClose={() => setShareModalData(null)}
        type={shareModalData?.type}
        title={shareModalData?.title}
        subtitle={shareModalData?.subtitle}
        url={shareModalData?.url}
        image={shareModalData?.image}
      />

      <ReportModal
        isOpen={!!reportModalData}
        onClose={() => setReportModalData(null)}
        type="campaign"
        campaignId={reportModalData?.campaignId}
        campaignSlug={reportModalData?.campaignSlug}
      />
    </section>
  );
}
