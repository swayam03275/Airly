import {
  BarChart3,
  Edit,
  Eye,
  FileText,
  Heart,
  RefreshCw,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import {
  adminService,
  AnalyticsData,
  PaginatedUsers,
  User,
} from "../../services/adminService";

interface StatCardProps {
  title: string;
  value: number;
  change?: number;
  icon: React.ElementType;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color,
}) => (
  <div className="group relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white/80 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
          {title}
        </p>
        <p className="mt-2 text-3xl font-bold text-gray-900">
          {value.toLocaleString()}
        </p>
        {change !== undefined && (
          <p
            className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${change >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            {change >= 0 ? "+" : ""}
            {change} this week
          </p>
        )}
      </div>
      <div className={`rounded-xl p-3 ${color} shadow-sm ring-1 ring-black/5`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

interface ChartCardProps {
  title: string;
  data: Array<{ _id: string; count: number }>;
  color: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, data, color }) => {
  const maxValue = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <div className="mt-5 space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">
              {new Date(item._id).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <div className="flex items-center space-x-2.5">
              <div className="h-2 w-28 rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full ${color} transition-all`}
                  style={{ width: `${(item.count / maxValue) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs font-semibold text-gray-900">
                {item.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface UserRowProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, onEdit, onDelete }) => (
  <tr className="transition-colors hover:bg-amber-50/40">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <img
          className="h-10 w-10 rounded-full border border-gray-200 object-cover"
          src={user.pfp}
          alt={user.fullName}
        />
        <div className="ml-4">
          <div className="text-sm font-semibold text-gray-900">
            {user.fullName}
          </div>
          <div className="text-xs text-gray-500">@{user.username}</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      {user.email}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
          user.role === "admin"
            ? "bg-violet-100 text-violet-800"
            : "bg-emerald-100 text-emerald-800"
        }`}
      >
        {user.role}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {new Date(user.createdAt).toLocaleDateString()}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {user.followers?.length || 0}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <button
        onClick={() => onEdit(user)}
        className="mr-3 inline-flex rounded-md p-1.5 text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-900"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(user._id)}
        className="inline-flex rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50 hover:text-red-900"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </td>
  </tr>
);

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users">("overview");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const data = await adminService.getAllUsers(currentPage, 10);
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  }, [currentPage]);

  useEffect(() => {
    loadAnalytics();
    if (activeTab === "users") {
      loadUsers();
    }
  }, [activeTab, loadAnalytics, loadUsers]);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await adminService.deleteUser(userId);
        loadUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  const handleUpdateUser = async (userData: Partial<User>) => {
    if (!editingUser) return;

    try {
      await adminService.updateUser(editingUser._id, userData);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      {/* Header */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-amber-200/40 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 -bottom-10 h-32 w-32 rounded-full bg-rose-200/40 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-semibold text-amber-700">
              <Shield className="h-3.5 w-3.5" />
              Admin Control Center
            </div>
            <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600 sm:text-base">
              Monitor platform analytics, identify trends, and manage your user
              base in one place.
            </p>
          </div>
          <button
            onClick={activeTab === "overview" ? loadAnalytics : loadUsers}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <nav className="inline-flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "User Management", icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as "overview" | "users")}
              className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === id
                  ? "bg-amber-500 text-white shadow"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && analytics && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Sparkles className="h-4 w-4 text-amber-500" />
                This Week Snapshot
              </div>
              <p className="text-sm text-gray-600">
                New Users:{" "}
                <span className="font-semibold text-gray-900">
                  {analytics.overview.newUsersThisWeek}
                </span>{" "}
                · New Posts:{" "}
                <span className="font-semibold text-gray-900">
                  {analytics.overview.newTweetsThisWeek}
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Platform Health
              </div>
              <p className="text-sm text-gray-600">
                Engagement trends are tracked through likes, views, posts, and
                active creators.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={analytics.overview.totalUsers}
              change={analytics.overview.newUsersThisWeek}
              icon={Users}
              color="bg-blue-500"
            />
            <StatCard
              title="Total Posts"
              value={analytics.overview.totalTweets}
              change={analytics.overview.newTweetsThisWeek}
              icon={FileText}
              color="bg-green-500"
            />
            <StatCard
              title="Total Likes"
              value={analytics.overview.totalLikes}
              icon={Heart}
              color="bg-red-500"
            />
            <StatCard
              title="Total Views"
              value={analytics.overview.totalViews}
              icon={Eye}
              color="bg-purple-500"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Daily User Registrations (Last 7 Days)"
              data={analytics.charts.dailyRegistrations}
              color="bg-blue-500"
            />
            <ChartCard
              title="Daily Posts (Last 7 Days)"
              data={analytics.charts.dailyPosts}
              color="bg-green-500"
            />
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Popular Tags */}
            <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-gray-900">
                Popular Tags
              </h3>
              <div className="space-y-3">
                {analytics.insights.popularTags
                  .slice(0, 5)
                  .map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600">#{tag.tag}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800">
                        {tag.count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Most Active Users */}
            <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-gray-900">
                Most Active Users
              </h3>
              <div className="space-y-3">
                {analytics.insights.mostActiveUsers
                  .slice(0, 5)
                  .map((user, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <img
                        src={user.pfp}
                        alt={user.fullName}
                        className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.postCount} posts
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Most Liked Posts */}
            <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-gray-900">
                Most Liked Posts
              </h3>
              <div className="space-y-3">
                {analytics.insights.mostLikedPosts
                  .slice(0, 3)
                  .map((post, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-100 pb-3 last:border-b-0"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {post.title}
                      </p>
                      <p className="text-xs text-gray-500 mb-1">
                        {post.content.substring(0, 60)}...
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{post.likesCount}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{post.views}</span>
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && users && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              User Management
            </h3>
            <p className="text-sm text-gray-600">
              Total: {users.pagination.total} users
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/90">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Followers
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.users.map((user) => (
                  <UserRow
                    key={user._id}
                    user={user}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * 10 + 1} to{" "}
              {Math.min(currentPage * 10, users.pagination.total)} of{" "}
              {users.pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(
                    Math.min(users.pagination.pages, currentPage + 1),
                  )
                }
                disabled={currentPage === users.pagination.pages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Edit User
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateUser({
                  fullName: formData.get("fullName") as string,
                  email: formData.get("email") as string,
                  role: formData.get("role") as "user" | "admin",
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    defaultValue={editingUser.fullName}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingUser.email}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    name="role"
                    defaultValue={editingUser.role}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
