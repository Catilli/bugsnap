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
  const [activeTab, setActiveTab] = useState<'chrome' | 'firefox' | 'safari'>('chrome');

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
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Download Extension</h2>
          <p className="text-gray-600 mt-1">Choose the version for your browser</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <a
            href="/bugsnap-chrome.zip"
            download
            className="flex flex-col items-center gap-3 p-5 border-2 border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors group"
          >
            <svg className="w-10 h-10" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#4285F4"/><circle cx="24" cy="24" r="9" fill="#fff"/><circle cx="24" cy="24" r="5" fill="#4285F4"/><path d="M24 15h18.5C39 7.5 32 2 24 2 16.5 2 10 6.5 7 13l8.5 14.5L24 15z" fill="#EA4335"/><path d="M7 13A22 22 0 0 0 24 46l8.5-14.5L15.5 27 7 13z" fill="#34A853"/><path d="M24 46c8 0 14.5-4 18.5-11L33 21H24l0 0 8.5 14.5L24 46z" fill="#FBBC05"/></svg>
            <span className="font-semibold text-gray-900 group-hover:text-indigo-700">Chrome</span>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium group-hover:bg-indigo-700 transition-colors">
              <Download className="w-4 h-4" />
              Download
            </span>
          </a>
          <a
            href="/bugsnap-firefox.zip"
            download
            className="flex flex-col items-center gap-3 p-5 border-2 border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors group"
          >
            <svg className="w-10 h-10" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#FF9500"/><path d="M24 4C13 4 4 13 4 24s9 20 20 20 20-9 20-20S35 4 24 4zm0 6c2 0 3.8.7 5.2 1.8C27.5 11.3 26 12 26 14c0 3 2.5 4 2.5 7 0 2-1.5 4-4.5 4s-5-2-5-5c0-4 3-5 3-8 0-1-.5-2.5-2-3.5A14 14 0 0 0 10 24c0 7.7 6.3 14 14 14s14-6.3 14-14c0-6.5-4.5-12-10-13.5A7 7 0 0 0 24 10z" fill="#FF3E00"/><circle cx="24" cy="24" r="8" fill="#fff" opacity="0.3"/></svg>
            <span className="font-semibold text-gray-900 group-hover:text-orange-700">Firefox</span>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium group-hover:bg-orange-600 transition-colors">
              <Download className="w-4 h-4" />
              Download
            </span>
          </a>
          <a
            href="/bugsnap-safari.zip"
            download
            className="flex flex-col items-center gap-3 p-5 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          >
            <svg className="w-10 h-10" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#006CFF"/><circle cx="24" cy="24" r="18" fill="#fff"/><circle cx="24" cy="24" r="16" fill="#006CFF" opacity="0.1"/><polygon points="24,8 27,22 24,24 21,22" fill="#FF3B30"/><polygon points="24,40 21,26 24,24 27,26" fill="#fff"/><circle cx="24" cy="24" r="2" fill="#333"/></svg>
            <span className="font-semibold text-gray-900 group-hover:text-blue-700">Safari</span>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium group-hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              Download
            </span>
          </a>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-gray-700 font-medium">Auto-login enabled - No need to login again!</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">Version 1.2 • All browsers supported</p>
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
            <h3 className="font-semibold text-gray-900 mb-2">Download & Extract</h3>
            <p className="text-sm text-gray-600">Download the extension for your browser and extract it to a <strong>permanent folder</strong> (not Downloads)</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <div className="text-3xl font-bold text-indigo-600 mb-2">2</div>
            <h3 className="font-semibold text-gray-900 mb-2">Load Extension</h3>
            <p className="text-sm text-gray-600">Follow the browser-specific steps below to install</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <div className="text-3xl font-bold text-indigo-600 mb-2">3</div>
            <h3 className="font-semibold text-gray-900 mb-2">Start Annotating</h3>
            <p className="text-sm text-gray-600">Visit any webpage and click the BugSnap icon</p>
          </div>
        </div>
      </div>

      {/* Detailed Instructions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Detailed Installation Steps</h2>

        {/* Browser Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('chrome')}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'chrome' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            Chrome / Edge
          </button>
          <button
            onClick={() => setActiveTab('firefox')}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'firefox' ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            Firefox
          </button>
          <button
            onClick={() => setActiveTab('safari')}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'safari' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            Safari
          </button>
        </div>

        {/* Chrome Instructions */}
        {activeTab === 'chrome' && (
          <div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">1</span>
                <h3 className="text-lg font-semibold text-gray-900">Open Extensions Page</h3>
              </div>
              <div className="ml-11 space-y-2">
                <p className="text-gray-700">Navigate to the extensions page:</p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-mono text-gray-900 mb-3">chrome://extensions/</p>
                  <p className="text-sm text-gray-600">OR: Menu → More Tools → Extensions</p>
                </div>
              </div>
            </div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">2</span>
                <h3 className="text-lg font-semibold text-gray-900">Enable Developer Mode</h3>
              </div>
              <div className="ml-11 space-y-2">
                <p className="text-gray-700">Toggle &quot;Developer mode&quot; in the top-right corner to ON.</p>
              </div>
            </div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">3</span>
                <h3 className="text-lg font-semibold text-gray-900">Extract to a Permanent Folder</h3>
              </div>
              <div className="ml-11 space-y-2">
                <p className="text-gray-700">Extract the downloaded ZIP to a <strong>permanent location</strong> on your computer, for example:</p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-1">
                  <p className="text-sm font-mono text-gray-900">C:\Users\YourName\browser-extensions\BugSnap</p>
                  <p className="text-sm font-mono text-gray-900">~/browser-extensions/BugSnap</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-2">
                  <p className="text-sm text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span><strong>Do not extract to your Downloads folder or temporary directories.</strong> Chrome links directly to this folder &mdash; if it gets moved, renamed, or deleted, the extension will break and you&apos;ll need to reinstall it.</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">4</span>
                <h3 className="text-lg font-semibold text-gray-900">Load the Extension</h3>
              </div>
              <div className="ml-11 space-y-2">
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Click &quot;Load unpacked&quot;</li>
                  <li>Navigate to the folder where you extracted the extension</li>
                  <li>Click &quot;Select Folder&quot;</li>
                </ul>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">5</span>
                <h3 className="text-lg font-semibold text-gray-900">Pin to Toolbar</h3>
              </div>
              <div className="ml-11 space-y-2">
                <p className="text-gray-700">Click the puzzle piece icon in the toolbar → find BugSnap → click the pin icon.</p>
              </div>
            </div>
          </div>
        )}

        {/* Firefox Instructions */}
        {activeTab === 'firefox' && (
          <div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">1</span>
                <h3 className="text-lg font-semibold text-gray-900">Open Add-ons Debugging</h3>
              </div>
              <div className="ml-11 space-y-2">
                <p className="text-gray-700">Navigate to the debugging page:</p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-mono text-gray-900">about:debugging#/runtime/this-firefox</p>
                </div>
              </div>
            </div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">2</span>
                <h3 className="text-lg font-semibold text-gray-900">Extract to a Permanent Folder</h3>
              </div>
              <div className="ml-11 space-y-2">
                <p className="text-gray-700">Extract the downloaded ZIP to a <strong>permanent location</strong> (e.g. <code className="bg-gray-100 px-2 py-1 rounded text-sm">~/browser-extensions/BugSnap</code>).</p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span><strong>Avoid your Downloads folder.</strong> If the extracted folder is moved or deleted, the extension will stop working.</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">3</span>
                <h3 className="text-lg font-semibold text-gray-900">Load Temporary Add-on</h3>
              </div>
              <div className="ml-11 space-y-2">
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Click &quot;Load Temporary Add-on...&quot;</li>
                  <li>Navigate to the folder where you extracted the extension</li>
                  <li>Select the <code className="bg-gray-100 px-2 py-1 rounded text-sm">manifest.json</code> file</li>
                </ul>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">4</span>
                <h3 className="text-lg font-semibold text-gray-900">Verify Installation</h3>
              </div>
              <div className="ml-11 space-y-2">
                <p className="text-gray-700">The BugSnap icon will appear in your toolbar. Temporary add-ons are removed when Firefox restarts.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-2">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    For permanent install, the extension must be signed via <a href="https://addons.mozilla.org" className="underline" target="_blank" rel="noopener noreferrer">addons.mozilla.org</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Safari Instructions */}
        {activeTab === 'safari' && (
          <div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">1</span>
                <h3 className="text-lg font-semibold text-gray-900">Convert to Xcode Project (macOS)</h3>
              </div>
              <div className="ml-11 space-y-2">
                <p className="text-gray-700">Open Terminal and run:</p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-mono text-gray-900">xcrun safari-web-extension-converter extension-safari/ --app-name BugSnap</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Requires Xcode 13+ and macOS 12+</p>
              </div>
            </div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">2</span>
                <h3 className="text-lg font-semibold text-gray-900">Build in Xcode</h3>
              </div>
              <div className="ml-11 space-y-2">
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Open the generated Xcode project</li>
                  <li>Select your development team under Signing & Capabilities</li>
                  <li>Click Run (Cmd + R) to build and launch</li>
                </ul>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">3</span>
                <h3 className="text-lg font-semibold text-gray-900">Enable in Safari</h3>
              </div>
              <div className="ml-11 space-y-2">
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Open Safari → Settings → Extensions</li>
                  <li>Check the box next to BugSnap to enable it</li>
                  <li>Grant permissions when prompted</li>
                </ul>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
                  <p className="text-sm text-blue-800 flex items-center gap-2">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    Enable &quot;Allow Unsigned Extensions&quot; in Safari → Develop menu if needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
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
                <li>Fill in the task title and description</li>
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
              <strong>Chrome/Edge:</strong> Click the puzzle piece icon in the toolbar, find &quot;BugSnap&quot;, and click the pin icon.
              <br /><strong>Firefox:</strong> Right-click the toolbar → Customize Toolbar → drag BugSnap to the toolbar.
              <br /><strong>Safari:</strong> Go to Safari → Settings → Extensions and ensure BugSnap is enabled.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Can&apos;t login?
            </h4>
            <p className="text-sm text-gray-600">
              Make sure the BugSnap API is reachable. In development, the API runs at <code className="bg-gray-100 px-2 py-1 rounded text-xs">http://localhost:3001</code>.
              Check network connectivity and ensure you&apos;re logged in to the web app.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <MousePointer2 className="w-4 h-4" />
              Can&apos;t annotate elements?
            </h4>
            <p className="text-sm text-gray-600">
              Ensure you&apos;re logged in, have selected a project, and clicked &quot;Start Annotating&quot;. Try refreshing the webpage.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Extension not working after update?
            </h4>
            <p className="text-sm text-gray-600">
              <strong>Chrome/Edge:</strong> Go to <code className="bg-gray-100 px-2 py-1 rounded text-xs">chrome://extensions/</code> and click the refresh icon.
              <br /><strong>Firefox:</strong> Go to <code className="bg-gray-100 px-2 py-1 rounded text-xs">about:debugging</code> and click &quot;Reload&quot;.
              <br /><strong>Safari:</strong> Disable and re-enable the extension in Safari → Settings → Extensions.
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
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Mozilla Firefox 109+</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Safari 15.4+ (macOS)</li>
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
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Developer mode enabled in browser</li>
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
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            Chrome/Edge source: <code className="bg-white px-2 py-1 rounded border border-gray-300 text-xs">/extension</code>
          </p>
          <p>
            Safari source: <code className="bg-white px-2 py-1 rounded border border-gray-300 text-xs">/extension-safari</code>
          </p>
          <p>
            Config: <code className="bg-white px-2 py-1 rounded border border-gray-300 text-xs">/extension/config.js</code> — toggle between local dev and production URLs
          </p>
          <p>
            Manifest version: <code className="bg-white px-2 py-1 rounded border border-gray-300 text-xs">3</code> (all browsers)
          </p>
        </div>
      </div>
    </div>
  );
}
