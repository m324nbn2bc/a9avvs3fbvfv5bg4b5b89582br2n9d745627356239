"use client";

import { useState } from "react";
import { getCampaignPreview, getProfileAvatar } from "../utils/imageTransform";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

export default function ShareModal({
  isOpen,
  onClose,
  type = "profile", // "profile" or "campaign"
  url,
  title,
  subtitle,
  image,
  // Legacy props for backward compatibility
  profileUrl,
  displayName,
  username,
  profileImage,
}) {
  const [copied, setCopied] = useState(false);

  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  // Use new props or fall back to legacy props
  const shareUrl = url || profileUrl;
  const shareTitle = title || displayName;
  const shareSubtitle = subtitle || (username ? `@${username}` : "");
  const rawImage = image || profileImage;
  const isProfile = type === "profile";
  
  // Apply ImageKit optimization based on type
  const shareImage = rawImage 
    ? (isProfile ? getProfileAvatar(rawImage) : getCampaignPreview(rawImage))
    : null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleShareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
  };

  const handleShareTwitter = () => {
    const twitterText = isProfile 
      ? `Check out ${shareTitle}'s profile on Twibbonize!`
      : `Check out this campaign: ${shareTitle} on Twibbonize!`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
  };

  const handleShareEmail = () => {
    const subject = isProfile 
      ? `Check out ${shareTitle}'s profile`
      : `Check out this campaign: ${shareTitle}`;
    const body = isProfile
      ? `I thought you might be interested in ${shareTitle}'s profile on Twibbonize: ${shareUrl}`
      : `I thought you might be interested in this campaign on Twibbonize: ${shareUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl max-w-md w-full p-6 pointer-events-auto shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Content Info */}
          <div className="text-center mb-6">
            {shareImage ? (
              <img
                src={shareImage}
                alt={shareTitle}
                className={`mx-auto mb-3 border-4 border-gray-100 ${
                  isProfile 
                    ? "w-20 h-20 rounded-full object-cover" 
                    : "max-w-32 max-h-32 rounded-lg object-contain"
                }`}
                loading="lazy"
              />
            ) : (
              <div className={`mx-auto mb-3 bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center border-4 border-gray-100 ${
                isProfile 
                  ? "w-20 h-20 rounded-full" 
                  : "w-32 h-32 rounded-lg"
              }`}>
                <span className="text-white text-2xl font-bold">
                  {shareTitle?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900">{shareTitle}</h3>
            {shareSubtitle && <p className="text-gray-500">{shareSubtitle}</p>}
          </div>

          {/* Share to Social Media */}
          <div className="mb-6">
            <h4 className="text-center text-gray-700 font-medium mb-4">
              Share to your social media
            </h4>
            <div className="flex justify-center gap-4">
              {/* Facebook */}
              <button
                onClick={handleShareFacebook}
                className="btn-base btn-facebook w-14 h-14 rounded-full"
                aria-label="Share on Facebook"
              >
                <svg
                  className="w-7 h-7 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              {/* Twitter/X */}
              <button
                onClick={handleShareTwitter}
                className="w-14 h-14 rounded-full bg-black hover:bg-gray-800 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Share on X"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>

              {/* Email */}
              <button
                onClick={handleShareEmail}
                className="w-14 h-14 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Share via Email"
              >
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or copy link</span>
            </div>
          </div>

          {/* Copy Link */}
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm focus:outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              } cursor-pointer`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
