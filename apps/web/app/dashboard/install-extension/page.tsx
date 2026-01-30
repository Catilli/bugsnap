'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Download,
  Zap,
  Layout,
  Settings,
  FolderOpen,
  LogOut,
  Folder,
  Plus,
  MousePointer2,
  Eye,
  Camera,
  Users,
  Flag,
  Keyboard,
  ShieldCheck,
  HelpCircle,
  Globe,
  Server,
  Code,
  ArrowRight,
  ChevronRight,
  X,
  RefreshCw,
  Puzzle,
  Pin,
  FileText,
  Check,
  Info,
  AlertTriangle,
  ExternalLink,
  Copy,
  Terminal,
} from 'lucide-react';

export default function InstallExtensionPage() {
  const [isExtensionInstalled] = useState<boolean | null>(null);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Install BugSnap Extension</h1>
        <p className="text-gray-600">
          Install our browser extension to create tasks directly from any webpage
        </p>
      </div>

      {/* Extension Status Banner */}
      {isExtensionInstalled !== null && (
        <div className={`rounded-lg p-4 mb-6 border-2 ${isExtensionInstalled ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center gap-3">
            {isExtensionInstalled ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-bold text-green-900">Extension Installed ✓</h3>
                  <p className="text-sm text-green-800">BugSnap extension is active and ready to use!</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-bold text-blue-900">Extension Not Detected</h3>
                  <p className="text-sm text-blue-800">Follow the instructions below to install the BugSnap extension</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Download Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Download Extension</h2>
            <p className="text-gray-600 mt-1">Get the latest version of BugSnap extension</p>
          </div>
          <a
            href="/bugsnap-extension.zip"
            download
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            <Download className="w-5 h-5" />
            Download Extension
          </a>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-gray-700 font-medium">Auto-login enabled - No need to login again!</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">Version 1.0.0 • Updated just now</p>
      </div>

      {/* Quick Start Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-8 h-8 text-indigo-600" />
          Quick Start - 3 Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <div className="text-3xl font-bold text-indigo-600 mb-2">1</div>
            <h3 className="font-semibold text-gray-900 mb-2">Open Extensions</h3>
            <p className="text-sm text-gray-600">Navigate to <code className="bg-gray-100 px-2 py-1 rounded text-xs">chrome://extensions/</code></p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <div className="text-3xl font-bold text-indigo-600 mb-2">2</div>
            <h3 className="font-semibold text-gray-900 mb-2">Enable Dev Mode</h3>
            <p className="text-sm text-gray-600">Toggle "Developer mode" in top-right corner</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <div className="text-3xl font-bold text-indigo-600 mb-2">3</div>
            <h3 className="font-semibold text-gray-900 mb-2">Load Extension</h3>
            <p className="text-sm text-gray-600">Click "Load unpacked" → Select <code className="bg-gray-100 px-2 py-1 rounded text-xs">extension</code> folder</p>
          </div>
        </div>
      </div>

      {/* Detailed Instructions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Detailed Installation Steps</h2>

        {/* Step 1 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">1</span>
            <h3 className="text-lg font-semibold text-gray-900">Open Chrome Extensions Page</h3>
          </div>
          <div className="ml-11 space-y-2">
            <p className="text-gray-700">Open Google Chrome and navigate to the extensions page:</p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-mono text-gray-900 mb-3">chrome://extensions/</p>
              <p className="text-sm text-gray-600">OR</p>
              <p className="text-sm text-gray-700 mt-2">Click the three dots menu → More Tools → Extensions</p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">2</span>
            <h3 className="text-lg font-semibold text-gray-900">Enable Developer Mode</h3>
          </div>
          <div className="ml-11 space-y-2">
            <p className="text-gray-700">Enable Developer mode to load unpacked extensions:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Look for the "Developer mode" toggle in the top-right corner</li>
              <li>Click the toggle to turn it ON (it will turn blue)</li>
              <li>New buttons will appear (Load unpacked, Pack extension, Update)</li>
            </ul>
          </div>
        </div>

        {/* Step 3 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">3</span>
            <h3 className="text-lg font-semibold text-gray-900">Load the Extension</h3>
          </div>
          <div className="ml-11 space-y-2">
            <p className="text-gray-700">Load the BugSnap extension folder:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Click the "Load unpacked" button</li>
              <li>Navigate to your BugSnap project directory</li>
              <li>Select the <code className="bg-gray-100 px-2 py-1 rounded text-sm">extension</code> folder</li>
              <li>Click "Select Folder"</li>
            </ul>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                The BugSnap extension will now appear in your extensions list
              </p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">4</span>
            <h3 className="text-lg font-semibold text-gray-900">Pin to Toolbar (Optional)</h3>
          </div>
          <div className="ml-11 space-y-2">
            <p className="text-gray-700">Pin the extension for easy access:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Click the puzzle piece icon in Chrome's toolbar</li>
              <li>Find "BugSnap - Visual Bug Tracking"</li>
              <li>Click the pin icon to keep it visible</li>
            </ul>
          </div>
        </div>
      </div>

      {/* First Use Guide */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">First-Time Setup</h2>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900 mb-1">Automatic Login</h4>
              <p className="text-sm text-green-800">
                Since you're already logged in to BugSnap, the extension will automatically sync your credentials. 
                No need to login again!
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Login */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <LogOut className="w-6 h-6 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-400 line-through">Login to Extension</h3>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Auto-synced</span>
            </div>
            <div className="ml-8">
              <p className="text-sm text-gray-600 italic">
                Authentication is automatically synced from your web app login. You're already authenticated!
              </p>
            </div>
          </div>

          {/* Select Project */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Folder className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Select Project</h3>
            </div>
            <div className="ml-8">
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Choose a project from the dropdown menu</li>
                <li>The "Start Annotating" button will become active</li>
              </ol>
            </div>
          </div>

          {/* Create Task */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Create Your First Task</h3>
            </div>
            <div className="ml-8">
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Navigate to any website</li>
                <li>Click "Start Annotating" in the popup</li>
                <li>Click any element on the page to annotate it</li>
                <li>Fill in the task title, description, and priority</li>
                <li>Click "Create Task"</li>
                <li>The task will appear in your project dashboard!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Extension Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <MousePointer2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Element Selection</h4>
              <p className="text-sm text-gray-600">Click any element on any webpage to annotate</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Visual Highlighting</h4>
              <p className="text-sm text-gray-600">Elements highlight on hover for easy targeting</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Camera className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Screenshot Capture</h4>
              <p className="text-sm text-gray-600">Automatic screenshot of selected elements</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Instant Task Creation</h4>
              <p className="text-sm text-gray-600">Create tasks without leaving the webpage</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Assignee Selection</h4>
              <p className="text-sm text-gray-600">Search and assign team members with autocomplete</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Flag className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Priority Levels</h4>
              <p className="text-sm text-gray-600">Set task priority: Not Set, Low, Medium, High, Critical</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Keyboard className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Keyboard Shortcuts</h4>
              <p className="text-sm text-gray-600">Press Alt + B to toggle annotation mode</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Auto-Login</h4>
              <p className="text-sm text-gray-600">Automatically syncs with your web app session</p>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HelpCircle className="w-6 h-6" />
          Common Issues
        </h2>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Puzzle className="w-4 h-4" />
              Extension icon not showing?
            </h4>
            <p className="text-sm text-gray-600">
              Click the puzzle piece icon in Chrome toolbar, find "BugSnap", and click the pin icon to keep it visible.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Can't login?
            </h4>
            <p className="text-sm text-gray-600">
              Make sure your API server is running at <code className="bg-gray-100 px-2 py-1 rounded text-xs">http://localhost:3001</code>. 
              Check network connectivity and credentials.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <MousePointer2 className="w-4 h-4" />
              Can't annotate elements?
            </h4>
            <p className="text-sm text-gray-600">
              Ensure you're logged in, have selected a project, and clicked "Start Annotating". Try refreshing the webpage.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Extension not working after update?
            </h4>
            <p className="text-sm text-gray-600">
              Go to <code className="bg-gray-100 px-2 py-1 rounded text-xs">chrome://extensions/</code> and click the refresh icon on the BugSnap extension.
            </p>
          </div>
        </div>
      </div>

      {/* Technical Requirements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Requirements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Supported Browsers
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Google Chrome 88+</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Microsoft Edge 88+</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Brave Browser</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Other Chromium-based browsers</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Server className="w-4 h-4" />
              System Requirements
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Active BugSnap account</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Internet connection</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> BugSnap API running (development)</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Chrome Developer mode enabled</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Keyboard className="w-6 h-6" />
          Keyboard Shortcuts
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <span className="text-gray-700">Toggle annotation mode</span>
            <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">Alt + B</kbd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <span className="text-gray-700">Cancel current action</span>
            <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">Esc</kbd>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-700">Submit task form</span>
            <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">Ctrl + Enter</kbd>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-indigo-600 text-white rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6" />
          Ready to Get Started?
        </h2>
        <p className="mb-4">
          Once the extension is installed, you can start creating tasks directly from any webpage.
        </p>
        <ul className="space-y-2 mb-6">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Click the BugSnap icon to login
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Select your project
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Start annotating web pages!
          </li>
        </ul>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
        >
          Back to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>

      {/* Technical Details */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Code className="w-5 h-5" />
          For Developers
        </h3>
        <p className="text-sm text-gray-700 mb-3">
          Extension location: <code className="bg-white px-2 py-1 rounded border border-gray-300 text-xs">/extension</code>
        </p>
        <p className="text-sm text-gray-700 mb-3">
          API endpoint: <code className="bg-white px-2 py-1 rounded border border-gray-300 text-xs">http://localhost:3001/api</code>
        </p>
        <p className="text-sm text-gray-700">
          Manifest version: <code className="bg-white px-2 py-1 rounded border border-gray-300 text-xs">3</code>
        </p>
      </div>
    </div>
  );
}
