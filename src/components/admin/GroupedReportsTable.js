"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  formatReportReason,
  getReportStatusColor,
  formatTimestamp,
  getModerationStatusColor,
} from "@/utils/admin/adminHelpers";

export default function GroupedReportsTable({
  summaries,
  loading,
  onSelectSummary,
  onRefresh,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (summaryId) => {
    setExpandedId(expandedId === summaryId ? null : summaryId);
  };

  const getReasonPercentage = (count, total) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <p className="mt-2 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No reports found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            No reports match your current filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reported Item
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reports
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Reported
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {summaries.map((summary) => (
              <>
                <tr key={summary.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0">
                        {summary.targetType === "user" ? (
                          summary.profileImage ? (
                            <img
                              className="h-12 w-12 rounded-full object-cover"
                              src={summary.profileImage}
                              alt={summary.displayName || "User"}
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center">
                              <span className="text-white text-lg font-medium">
                                {summary.displayName
                                  ?.charAt(0)
                                  ?.toUpperCase() || "U"}
                              </span>
                            </div>
                          )
                        ) : summary.campaignImage ? (
                          <img
                            className="h-12 w-12 rounded object-cover"
                            src={summary.campaignImage}
                            alt={summary.campaignTitle || "Campaign"}
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                            <svg
                              className="h-6 w-6 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
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
                      </div>
                      <div className="ml-4">
                        {summary.targetType === "user" ? (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              {summary.displayName || "Unknown User"}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{summary.username || "unknown"}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              {summary.campaignTitle || "Unknown Campaign"}
                            </div>
                            <div className="text-sm text-gray-500">
                              by {summary.creator?.displayName || "Unknown"}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <span className="text-2xl font-bold text-red-600">
                        {summary.reportsCount || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getModerationStatusColor(summary.targetType === 'user' ? summary.accountStatus : summary.moderationStatus)}`}
                    >
                      {summary.targetType === 'user' ? (summary.accountStatus || "active") : (summary.moderationStatus || "active")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(summary.lastReportedAt, true)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpand(summary.id)}
                        className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                      >
                        {expandedId === summary.id
                          ? "Hide Breakdown"
                          : "View Breakdown"}
                      </button>
                      <button
                        onClick={() => onSelectSummary(summary)}
                        className="px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Take Action
                      </button>
                    </div>
                  </td>
                </tr>

                {expandedId === summary.id && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 bg-gray-50">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">
                          Report Breakdown
                        </h4>

                        {summary.reasonCounts &&
                        Object.keys(summary.reasonCounts).length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(summary.reasonCounts)
                              .sort(([, a], [, b]) => b - a)
                              .map(([reason, count]) => {
                                const percentage = getReasonPercentage(
                                  count,
                                  summary.reportsCount,
                                );
                                return (
                                  <div
                                    key={reason}
                                    className="bg-white p-3 rounded border border-gray-200"
                                  >
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-sm font-medium text-gray-900">
                                        {formatReportReason(reason)}
                                      </span>
                                      <span className="text-sm font-bold text-gray-700">
                                        {count} ({percentage}%)
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-red-500 h-2 rounded-full transition-all"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No reason breakdown available
                          </p>
                        )}

                        <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                          <div>
                            First Report:{" "}
                            {formatTimestamp(summary.firstReportedAt, true)}
                          </div>
                          <div>
                            Latest Report:{" "}
                            {formatTimestamp(summary.lastReportedAt, true)}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
