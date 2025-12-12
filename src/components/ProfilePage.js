"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  getUserProfile,
  getUserProfileByUsername,
  getUserStats,
  getUserCampaigns,
} from "../lib/firestore";
import { getProfileAvatar, getProfileBanner } from "../utils/imageTransform";
import { abbreviateNumber } from "../utils/validation";
import CampaignGallery from "./CampaignGallery";
import ReportModal from "./ReportModal";
import CreateCampaignModal from "./CreateCampaignModal";
import ShareModal from "./ShareModal";
import Pagination from "./Pagination";

export default function ProfilePage({ isOwnProfile = false, username = null }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(true);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userStats, setUserStats] = useState({
    supportsCount: 0,
    campaignsCount: 0,
  });
  const [campaigns, setCampaigns] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [error, setError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const loadCampaigns = useCallback(async (userId, page = 1) => {
    setCampaignsLoading(true);
    try {
      const result = await getUserCampaigns(userId, { page, pageSize: 10 });
      setCampaigns(result.campaigns);
      setCurrentPage(result.currentPage);
      setTotalPages(result.totalPages);
      setTotalCampaigns(result.totalCount);
      
      const totalSupports = result.campaigns.reduce((sum, campaign) => {
        const count = Number(campaign.supportersCount) || 0;
        return sum + count;
      }, 0);
      
      return { totalSupports, totalCount: result.totalCount };
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setCampaigns([]);
      return { totalSupports: 0, totalCount: 0 };
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOwnProfile && !loading && !user) {
      router.push("/");
      return;
    }

    const loadProfileData = async () => {
      setProfileLoading(true);
      setError(null);

      try {
        let profileUser = null;

        if (isOwnProfile && user) {
          profileUser = await getUserProfile(user.uid);
          if (!profileUser) {
            profileUser = {
              id: user.uid,
              displayName: user.displayName || user.email || "User",
              username: user.email?.split("@")[0] || "user",
              email: user.email,
              photoURL: user.photoURL,
              bio: "",
              profileImage:
                user.photoURL ||
                "https://via.placeholder.com/120x120/059669/FFFFFF?text=U",
              bannerImage:
                "https://via.placeholder.com/1200x300/10B981/FFFFFF?text=Banner",
              supportersCount: 0,
              campaignsCount: 0,
              createdAt: new Date(),
            };
          }
        } else if (username) {
          profileUser = await getUserProfileByUsername(username);
          if (!profileUser) {
            setError("User not found");
            setProfileLoading(false);
            return;
          }
        }

        if (profileUser) {
          setUserData(profileUser);

          try {
            const { totalSupports, totalCount } = await loadCampaigns(profileUser.id, 1);

            try {
              const stats = await getUserStats(profileUser.id);

              setUserStats({
                supportsCount: totalSupports,
                campaignsCount: stats?.campaignsCount || totalCount,
              });
            } catch (statError) {
              setUserStats({
                supportsCount: totalSupports,
                campaignsCount: totalCount,
              });
            }
          } catch (campaignError) {
            setCampaigns([]);
            setUserStats({ supportsCount: 0, campaignsCount: 0 });
          }
        }
      } catch (error) {
        setError("Failed to load profile data");
      } finally {
        setProfileLoading(false);
      }
    };

    if (!loading) {
      loadProfileData();
    }
  }, [user, loading, isOwnProfile, username, router, loadCampaigns]);

  const handlePageChange = (page) => {
    if (userData) {
      loadCampaigns(userData.id, page);
      const campaignsSection = document.getElementById('campaigns-section');
      if (campaignsSection) {
        campaignsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (loading || profileLoading) {
    return <ProfileSkeleton />;
  }

  if (isOwnProfile && !user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{error}</h3>
          <p className="text-gray-600 mb-6">
            The profile you're looking for could not be found.
          </p>
          <button
            onClick={() => router.push("/")}
            className="btn-base btn-primary px-6 py-3 font-medium"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative w-full aspect-[4/1] bg-gradient-to-r from-emerald-500 to-emerald-600">
        {userData.bannerImage && userData.bannerImage.trim() ? (
          <img
            src={getProfileBanner(userData.bannerImage)}
            alt="Profile Banner"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0">
            {userData.profileImage && userData.profileImage.trim() ? (
              <img
                src={getProfileAvatar(userData.profileImage)}
                alt={userData.displayName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-xl object-cover bg-white"
                loading="lazy"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="text-white text-2xl sm:text-3xl font-bold">
                  {userData.displayName?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1
              className={`font-bold text-gray-900 ${
                userData.displayName?.length <= 15
                  ? "text-2xl sm:text-3xl"
                  : userData.displayName?.length <= 25
                    ? "text-xl sm:text-2xl"
                    : userData.displayName?.length <= 35
                      ? "text-lg sm:text-xl"
                      : "text-base sm:text-lg"
              } break-words leading-tight`}
              title={userData.displayName}
            >
              {userData.displayName}
            </h1>
            <p
              className={`text-gray-500 font-medium ${
                userData.username?.length <= 20
                  ? "text-sm sm:text-base"
                  : "text-xs sm:text-sm"
              } break-words mt-1`}
            >
              @{userData.username}
            </p>
          </div>

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Profile options"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />

                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowShareModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150 flex items-center gap-2 cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                    Share Profile
                  </button>

                  {isOwnProfile ? (
                    <>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          router.push(`/u/${userData.username}`);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150 flex items-center gap-2 cursor-pointer"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View as Public
                      </button>

                      <button
                        onClick={() => {
                          setShowMenu(false);
                          router.push("/profile/edit");
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150 flex items-center gap-2 cursor-pointer"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit Profile
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowReportModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center gap-2 cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      Report User
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {userData.bio && (
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed whitespace-pre-wrap mb-6 max-w-2xl">
            {userData.bio}
          </p>
        )}

        <div className="flex flex-row gap-3 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 flex-1 text-center">
            <div className="text-lg sm:text-3xl font-bold text-emerald-600">
              {abbreviateNumber(userStats.supportsCount)}
            </div>
            <div className="text-[10px] sm:text-sm text-gray-600 font-medium mt-0.5 sm:mt-2">
              Supports
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 flex-1 text-center">
            <div className="text-lg sm:text-3xl font-bold text-emerald-600">
              {abbreviateNumber(userStats.campaignsCount)}
            </div>
            <div className="text-[10px] sm:text-sm text-gray-600 font-medium mt-0.5 sm:mt-2">
              Campaigns
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 flex-1 text-center">
            <div className="text-sm sm:text-3xl font-bold text-emerald-600 leading-tight">
              {userData.createdAt
                ? new Date(
                    userData.createdAt.seconds
                      ? userData.createdAt.seconds * 1000
                      : userData.createdAt,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Recently"}
            </div>
            <div className="text-[10px] sm:text-sm text-gray-600 font-medium mt-0.5 sm:mt-2">
              Joined Since
            </div>
          </div>
        </div>

        <div id="campaigns-section" className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Campaigns</h2>
              {totalPages > 1 && (
                <p className="text-sm text-gray-500 mt-1">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>
            {isOwnProfile && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-base btn-primary px-4 py-2 text-sm font-medium"
              >
                Create Campaign
              </button>
            )}
          </div>

          {campaignsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <CampaignGallery
                campaigns={campaigns}
                loading={false}
                isOwnProfile={isOwnProfile}
                showReportOption={!isOwnProfile}
                onCampaignDeleted={(campaignId) => {
                  setCampaigns(campaigns.filter(c => c.id !== campaignId));
                  setUserStats(prev => ({ ...prev, campaignsCount: Math.max(0, prev.campaignsCount - 1) }));
                  setTotalCampaigns(prev => Math.max(0, prev - 1));
                }}
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

      {!isOwnProfile && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          type="user"
          reportedUserId={userData?.id}
          reportedUsername={userData?.username}
        />
      )}

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        profileUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/u/${userData?.username || ""}`}
        displayName={userData?.displayName || "User"}
        username={userData?.username || "user"}
        profileImage={userData?.profileImage || null}
      />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative w-full aspect-[4/1] bg-gray-300 animate-pulse"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-400 rounded-full animate-pulse flex-shrink-0"></div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="h-7 sm:h-8 bg-gray-300 rounded w-40 sm:w-48 animate-pulse"></div>
            <div className="h-4 sm:h-5 bg-gray-300 rounded w-24 sm:w-32 animate-pulse"></div>
          </div>
        </div>

        <div className="mb-6 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-full max-w-2xl animate-pulse"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 max-w-2xl animate-pulse"></div>
        </div>

        <div className="flex flex-row gap-3 mb-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-lg p-3 sm:p-6 flex-1 text-center"
            >
              <div className="h-6 sm:h-9 bg-gray-300 rounded w-12 sm:w-16 mx-auto animate-pulse mb-1"></div>
              <div className="h-2.5 sm:h-4 bg-gray-300 rounded w-14 sm:w-16 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="h-8 bg-gray-300 rounded w-32 animate-pulse mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-gray-300 rounded-xl animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
