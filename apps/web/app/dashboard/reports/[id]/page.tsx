'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;
  const [status, setStatus] = useState('open');
  const [priority, setPriority] = useState('medium');

  // TODO: Fetch report data with React Query
  const report = {
    id: reportId,
    title: 'Button not responding to clicks',
    description: 'The submit button on the contact form does not respond when clicked. Tested on multiple browsers.',
    url: 'https://example.com/contact',
    screenshotUrl: 'https://via.placeholder.com/1200x800',
    status: 'open',
    priority: 'high',
    createdBy: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    team: {
      name: 'Frontend Team',
    },
    environmentData: {
      browser: 'Chrome',
      browserVersion: '120.0.0',
      os: 'Windows 11',
      screenResolution: '1920x1080',
      viewportSize: '1366x768',
      timestamp: '2024-01-27T10:00:00Z',
    },
    createdAt: '2024-01-27T10:00:00Z',
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/reports"
            className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
          >
            ← Back to reports
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{report.title}</h1>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Share Report
        </button>
      </div>

      {/* Status and Priority Badges */}
      <div className="flex gap-3 mb-6">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
          {report.status.replace('_', ' ').toUpperCase()}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(report.priority)}`}>
          {report.priority.toUpperCase()} PRIORITY
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Screenshot */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Screenshot</h2>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <img
                src={report.screenshotUrl}
                alt={report.title}
                className="w-full"
              />
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>
            
            {/* Empty state */}
            <div className="text-center py-8 text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-sm">No comments yet. Be the first to comment!</p>
            </div>

            {/* Comment Form */}
            <div className="mt-6">
              <textarea
                placeholder="Write a comment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              ></textarea>
              <button className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Add Comment
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Update Status</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Update
              </button>
            </div>
          </div>

          {/* Environment Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Environment</h3>
            
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-600">Browser</dt>
                <dd className="text-gray-900 font-medium">
                  {report.environmentData.browser} {report.environmentData.browserVersion}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">OS</dt>
                <dd className="text-gray-900 font-medium">{report.environmentData.os}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Screen Resolution</dt>
                <dd className="text-gray-900 font-medium">{report.environmentData.screenResolution}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Viewport</dt>
                <dd className="text-gray-900 font-medium">{report.environmentData.viewportSize}</dd>
              </div>
              <div>
                <dt className="text-gray-600">URL</dt>
                <dd className="text-gray-900 font-medium break-all">
                  <a
                    href={report.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 underline"
                  >
                    {report.url}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">Reported</dt>
                <dd className="text-gray-900 font-medium">
                  {new Date(report.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Report Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Report Info</h3>
            
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-600">Team</dt>
                <dd className="text-gray-900 font-medium">{report.team.name}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Reported by</dt>
                <dd className="text-gray-900 font-medium">{report.createdBy.name}</dd>
                <dd className="text-gray-500 text-xs">{report.createdBy.email}</dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions</h3>
            
            <div className="space-y-2">
              <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left">
                Copy Share Link
              </button>
              <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left">
                Download Screenshot
              </button>
              <button className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left">
                Delete Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}