'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewReportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    priority: 'medium',
    teamId: '',
  });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Collect environment data
      const environmentData = {
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other',
        browserVersion: navigator.appVersion,
        os: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        url: formData.url,
        pageTitle: formData.title,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // TODO: Upload screenshot and create report via API
      console.log('Form data:', formData);
      console.log('Environment data:', environmentData);
      console.log('Screenshot:', screenshot);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create report');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
        >
          ← Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create Bug Report</h1>
        <p className="text-gray-600 mt-2">Capture and report website issues with detailed context</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Submit button not working on contact form"
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                Page URL *
              </label>
              <input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/page"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={6}
                maxLength={5000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe the issue in detail. Include steps to reproduce, expected behavior, and actual behavior."
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/5000 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority *
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 mb-1">
                  Team *
                </label>
                <select
                  id="teamId"
                  value={formData.teamId}
                  onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a team</option>
                  {/* TODO: Load teams from API */}
                  <option value="team-1">Frontend Team</option>
                  <option value="team-2">Backend Team</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Screenshot Upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Screenshot *</h2>
          
          <div>
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 cursor-pointer transition-colors">
                {screenshotPreview ? (
                  <div>
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="max-h-96 mx-auto rounded-lg mb-4"
                    />
                    <p className="text-sm text-gray-600">Click to change screenshot</p>
                  </div>
                ) : (
                  <div>
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-4"
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
                    <p className="text-sm text-gray-600 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, WebP up to 10MB</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleScreenshotChange}
                required
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Environment Info Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Environment Data
            <span className="ml-2 text-sm font-normal text-gray-500">(Auto-collected)</span>
          </h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Browser:</span>
              <span className="ml-2 text-gray-900 font-medium">
                {navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">OS:</span>
              <span className="ml-2 text-gray-900 font-medium">{navigator.platform}</span>
            </div>
            <div>
              <span className="text-gray-600">Screen:</span>
              <span className="ml-2 text-gray-900 font-medium">
                {window.screen.width}x{window.screen.height}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Viewport:</span>
              <span className="ml-2 text-gray-900 font-medium">
                {window.innerWidth}x{window.innerHeight}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 justify-end">
          <Link
            href="/dashboard"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Report...' : 'Create Report'}
          </button>
        </div>
      </form>
    </div>
  );
}