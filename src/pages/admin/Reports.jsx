import { useState, useEffect } from "react";
import { Download, Calendar } from "lucide-react";
import { toast } from "react-toastify";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";
import { formatDate } from "../../utils/formatters";
import * as reportService from "../../services/reportService";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "users", label: "Users" },
  { value: "jobs", label: "Jobs" },
  { value: "hiring", label: "Hiring" },
  { value: "submissions", label: "Submissions" },
];

const EXPORT_FORMATS = [
  { value: "pdf", label: "Export as PDF" },
  { value: "csv", label: "Export as CSV" },
  { value: "excel", label: "Export as Excel" },
];

const COLORS = ["#f97316", "#fdba74", "#fed7aa", "#fccf86", "#fbbf24"];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState("30days");
  const [exporting, setExporting] = useState(false);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = { range: dateRange };
      const res = await reportService.getReport(activeTab, params);
      setData(res.data);
    } catch (err) {

  const status = err.response?.status?? err?.status;
      if (status === 403 || err.message?.includes("404")) {
        setData(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeTab, dateRange]);

  const handleExport = async (format) => {
    try {
      setExporting(true);
      await reportService.exportReport(activeTab, { format, range: dateRange });
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  if (error) {
    return (
      <ErrorState
        title="Failed to load reports"
        message={error}
        onRetry={fetchReportData}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-600">
            Analytics and insights for your platform
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 py-2">
            <Calendar size={18} className="text-gray-600" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-sm focus:outline-none"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="1year">Last year</option>
            </select>
          </div>

          <div className="relative group">
            <button className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
              <Download size={18} />
              Export
            </button>
            <div className="absolute right-0 mt-1 hidden w-48 rounded-lg border border-orange-100 bg-white shadow-lg group-hover:block z-10">
              {EXPORT_FORMATS.map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => handleExport(fmt.value)}
                  disabled={exporting}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-orange-50 first:rounded-t-lg last:rounded-b-lg disabled:bg-gray-100"
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 rounded-lg border border-orange-100 bg-white p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.value
                ? "bg-orange-100 text-orange-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton rows={2} columns={2} />
          <LoadingSkeleton rows={3} columns={1} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Charts Grid */}
          {data?.charts && data.charts.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {data.charts.map((chart, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm"
                >
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    {chart.title}
                  </h3>
                  {chart.type === "line" && (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                        <XAxis dataKey={chart.xKey} stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff7ed",
                            border: "1px solid #fed7aa",
                          }}
                        />
                        <Legend />
                        {chart.dataKeys.map((key) => (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke="#f97316"
                            strokeWidth={2}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  {chart.type === "bar" && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                        <XAxis dataKey={chart.xKey} stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff7ed",
                            border: "1px solid #fed7aa",
                          }}
                        />
                        <Legend />
                        {chart.dataKeys.map((key) => (
                          <Bar key={key} dataKey={key} fill="#f97316" />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {chart.type === "pie" && (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chart.data}
                          dataKey={chart.dataKeys[0]}
                          nameKey={chart.xKey}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {chart.data.map((_, i) => (
                            <Cell
                              key={`cell-${i}`}
                              fill={COLORS[i % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              ))}
            </div>
          )}

        
          {/* Data Table */}
          {data?.table && data.table.rows && data.table.rows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white shadow-sm">
              <table className="w-full">
                <thead className="border-b border-orange-100 bg-orange-50">
                  <tr>
                    {data.table.columns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.table.rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-orange-50 hover:bg-orange-50"
                    >
                      {Object.values(row).map((val, i) => (
                        <td key={i} className="px-4 py-3 text-sm text-gray-600">
                          {typeof val === "object" ? JSON.stringify(val) : val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!data?.charts && !data?.metrics && !data?.table && (
            <div className="rounded-lg border border-orange-100 bg-white p-8 text-center">
              <p className="text-gray-600">No data available for this report</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
