import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Building2, Briefcase, FileText, CalendarDays, Upload, ShieldX, UserCheck } from 'lucide-react';
import MetricCard from '../../components/shared/MetricCard';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';
import ErrorState from '../../components/shared/ErrorState';
import Avatar from '../../components/shared/Avatar';
import { formatDate, timeAgo } from '../../utils/formatters';
import * as userService from '../../services/userService';
import * as companyService from '../../services/companyService';
import * as candidateService from '../../services/candidateService';
import * as jobService from '../../services/jobService';
import * as applicationService from '../../services/applicationService';
import * as interviewService from '../../services/interviewService';

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [users, companies, candidates, jobs, applications, interviews] = await Promise.all([
          userService.getUsers(),
          companyService.getCompanies(),
          candidateService.getCandidates(),
          jobService.getJobs(),
          applicationService.getApplications(),
          interviewService.getInterviews(),
        ]);

        setData({
          users: users.data.data || [],
          companies: companies.data.data || [],
          candidates: candidates.data.data || [],
          jobs: jobs.data.data || [],
          applications: applications.data.data || [],
          interviews: interviews.data.data || [],
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              <div className="mt-3 h-8 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load overview" message={error} />;
  }

  const totalUsers = data.users.length;
  const totalCompanies = data.companies.length;
  const totalJobs = data.jobs.length;
  const totalApplications = data.applications.length;
  const activeInterviews = data.interviews.filter(i => i.status === 'scheduled').length;
  const blockedUsers = data.users.filter(u => u.status === 'blocked').length;

  const chartData = [
    { week: 'Week 1', candidates: 45, companies: 12 },
    { week: 'Week 2', candidates: 52, companies: 15 },
    { week: 'Week 3', candidates: 48, companies: 18 },
    { week: 'Week 4', candidates: 61, companies: 22 },
  ];

  const recentUsers = data.users.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Metric Cards Row 1 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Users" value={totalUsers} icon={Users} />
        <MetricCard title="Total Companies" value={totalCompanies} icon={Building2} />
        <MetricCard title="Total Jobs" value={totalJobs} icon={Briefcase} />
        <MetricCard title="Total Applications" value={totalApplications} icon={FileText} />
      </div>

      {/* Metric Cards Row 2 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Active Interviews" value={activeInterviews} icon={CalendarDays} />
        <MetricCard title="Submissions" value={data.interviews.length} icon={Upload} />
        <MetricCard title="Blocked Accounts" value={blockedUsers} icon={ShieldX} color="red" />
        <MetricCard title="Hired This Month" value="24" icon={UserCheck} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Line Chart */}
        <div className="lg:col-span-2 rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Platform Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
              <XAxis dataKey="week" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }} />
              <Legend />
              <Line type="monotone" dataKey="candidates" stroke="#f97316" strokeWidth={2} />
              <Line type="monotone" dataKey="companies" stroke="#fdba74" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Breakdown */}
        <div className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">User Breakdown</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Candidates</span>
                <span className="font-semibold text-gray-900">{data.candidates.length}</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${(data.candidates.length / (data.candidates.length + data.companies.length)) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Companies</span>
                <span className="font-semibold text-gray-900">{data.companies.length}</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-orange-300"
                  style={{ width: `${(data.companies.length / (data.candidates.length + data.companies.length)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Registrations</h3>
        <div className="space-y-3">
          {recentUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between rounded-lg border border-orange-50 p-3 hover:bg-orange-50">
              <div className="flex items-center gap-3">
                <Avatar name={user.full_name} size="md" />
                <div>
                  <p className="font-medium text-gray-900">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                  {user.role}
                </span>
                <p className="mt-1 text-xs text-gray-500">{timeAgo(user.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-orange-100 bg-white p-4">
          <p className="text-xs font-medium text-gray-600">API Response Time</p>
          <p className="mt-2 text-2xl font-bold text-green-600">142ms</p>
          <p className="mt-1 text-xs text-gray-500">↓ 5% from yesterday</p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-white p-4">
          <p className="text-xs font-medium text-gray-600">Active Sessions</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">248</p>
          <p className="mt-1 text-xs text-gray-500">↑ 12% from yesterday</p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-white p-4">
          <p className="text-xs font-medium text-gray-600">Storage Used</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">45.2GB</p>
          <p className="mt-1 text-xs text-gray-500">of 500GB available</p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-white p-4">
          <p className="text-xs font-medium text-gray-600">Uptime</p>
          <p className="mt-2 text-2xl font-bold text-green-600">99.9%</p>
          <p className="mt-1 text-xs text-gray-500">Last 30 days</p>
        </div>
      </div>
    </div>
  );
}
