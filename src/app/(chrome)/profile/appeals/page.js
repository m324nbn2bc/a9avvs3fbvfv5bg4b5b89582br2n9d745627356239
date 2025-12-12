'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AuthGate from '@/components/AuthGate';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AppealsPage() {
  return (
    <AuthGate>
      <ErrorBoundary>
        <AppealsContent />
      </ErrorBoundary>
    </AuthGate>
  );
}

function AppealsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removedItems, setRemovedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [appealReason, setAppealReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRemovedItems = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = await user.getIdToken();

      const response = await fetch('/api/appeals/eligible', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch eligible items');
      }

      const data = await response.json();
      setRemovedItems(data.items || []);
    } catch (err) {
      console.error('Error fetching removed items:', err);
      setError('Failed to load eligible items for appeal');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRemovedItems();
  }, [fetchRemovedItems]);

  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    
    if (!selectedItem) {
      setError('Please select an item to appeal');
      return;
    }

    if (appealReason.trim().length < 20) {
      setError('Appeal reason must be at least 20 characters');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const token = await user.getIdToken();

      const response = await fetch('/api/appeals/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: selectedItem.type,
          targetId: selectedItem.id,
          reason: appealReason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit appeal');
      }

      setSuccess('Appeal submitted successfully! You will be notified of the outcome.');
      setAppealReason('');
      setSelectedItem(null);
      
      setTimeout(() => {
        router.push('/profile/notifications');
      }, 2000);
    } catch (err) {
      console.error('Error submitting appeal:', err);
      setError(err.message || 'Failed to submit appeal');
    } finally {
      setSubmitting(false);
    }
  };

  const isDeadlinePassed = (deadline) => {
    const deadlineDate = deadline?.toDate
      ? deadline.toDate()
      : new Date(deadline);
    return new Date() > deadlineDate;
  };

  const formatDeadline = (deadline) => {
    const deadlineDate = deadline?.toDate
      ? deadline.toDate()
      : new Date(deadline);
    return deadlineDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Submit an Appeal</h1>
          <p className="mt-2 text-gray-600">
            If your content was removed or your account was banned, you can submit an appeal within the deadline.
          </p>
        </div>

        {removedItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Items Eligible for Appeal
            </h2>
            <p className="text-gray-600">
              You don't have any removed content or banned accounts that are eligible for appeal.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">{success}</p>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Select Item to Appeal
              </h2>
              <div className="space-y-3">
                {removedItems.map((item) => {
                  const deadlinePassed = isDeadlinePassed(item.appealDeadline);
                  
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedItem?.id === item.id
                          ? 'border-blue-500 bg-blue-50'
                          : deadlinePassed
                          ? 'border-gray-200 bg-gray-50 opacity-60'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => !deadlinePassed && setSelectedItem(item)}
                    >
                      <div className="flex items-start gap-4">
                        {item.type === 'campaign' && item.imageUrl && (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Type:</span>{' '}
                            {item.type === 'campaign' ? 'Campaign' : 'Account'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Reason:</span>{' '}
                            {item.removalReason || item.banReason || 'Not specified'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Deadline:</span>{' '}
                            {formatDeadline(item.appealDeadline)}
                            {deadlinePassed && (
                              <span className="text-red-600 ml-2">(Expired)</span>
                            )}
                          </p>
                          {item.appealCount > 0 && (
                            <p className="text-sm text-orange-600 mt-1">
                              ⚠️ You have already submitted {item.appealCount} appeal(s) for this item
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedItem && !isDeadlinePassed(selectedItem.appealDeadline) && (
              <form onSubmit={handleSubmitAppeal} className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Appeal Reason
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Explain why you believe this {selectedItem.type} should be restored. Be clear and respectful.
                  Minimum 20 characters required.
                </p>
                <textarea
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Enter your appeal reason here..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                  minLength={20}
                />
                <div className="mt-2 text-sm text-gray-500">
                  {appealReason.length} / 20 characters minimum
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting || appealReason.trim().length < 20}
                    className="btn-base btn-info flex-1 px-6 py-3"
                  >
                    {submitting ? 'Submitting...' : 'Submit Appeal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(null);
                      setAppealReason('');
                      setError('');
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
