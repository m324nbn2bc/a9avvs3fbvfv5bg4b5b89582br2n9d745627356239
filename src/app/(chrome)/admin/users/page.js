"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import UsersTable from "@/components/admin/UsersTable";
import UserDetailsModal from "@/components/admin/UserDetailsModal";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function AdminUsersPage() {
  return (
    <ErrorBoundary>
      <AdminUsersContent />
    </ErrorBoundary>
  );
}

function AdminUsersContent() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('admin');
  const [limit, setLimit] = useState(10);

  const fetchUsers = async (isLoadMore = false) => {
    if (!user) return;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const token = await user.getIdToken();
      
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (searchTerm) params.append('search', searchTerm);
      params.append('limit', limit.toString());
      
      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      const newUsers = data.data || [];
      setUsers(newUsers);
      setHasMore(newUsers.length === limit);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    setLimit(prev => prev + 10);
    setTimeout(() => fetchUsers(true), 0);
  };

  const handleSelectUser = (selectedUser) => {
    setSelectedUser(selectedUser);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  const handleUserUpdate = () => {
    setSelectedUser(null);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Load Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or username..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
            >
              <option value="all" className="text-gray-900">All Roles</option>
              <option value="user" className="text-gray-900">Users</option>
              <option value="admin" className="text-gray-900">Admins</option>
            </select>
          </div>

          <div>
            <label htmlFor="limit-input" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Users
            </label>
            <input
              id="limit-input"
              type="number"
              min="1"
              max="500"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
              placeholder="10"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchUsers}
              disabled={loading || !user}
              className="w-full px-6 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                'Load Users'
              )}
            </button>
          </div>
        </div>
        {users.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing <span className="font-semibold">{users.length}</span> user{users.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <UsersTable
        users={users}
        loading={loading}
        onSelectUser={handleSelectUser}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {users.length > 0 && hasMore && !loading && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-8 py-3 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loadingMore ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading More...
              </span>
            ) : (
              'Load More (10 items)'
            )}
          </button>
        </div>
      )}

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={handleCloseModal}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
}
