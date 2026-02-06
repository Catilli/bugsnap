'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Shield, Server, Database, Globe } from 'lucide-react';

interface AuditItem {
  title: string;
  description: string;
  status: 'not_implemented' | 'partial';
}

interface AuditCategory {
  name: string;
  icon: React.ReactNode;
  items: AuditItem[];
}

const auditData: AuditCategory[] = [
  {
    name: 'Architecture',
    icon: <Globe className="w-4 h-4" />,
    items: [
      {
        title: 'Safari Extension',
        description: 'No Xcode project or Safari extension wrapper',
        status: 'not_implemented',
      },
      {
        title: 'Custom Domain Configuration',
        description: 'Using default platform subdomains — no custom domain configured yet',
        status: 'partial',
      },
    ],
  },
  {
    name: 'Security',
    icon: <Shield className="w-4 h-4" />,
    items: [
      {
        title: 'CSRF Protection',
        description: 'JWT-only auth without CSRF tokens',
        status: 'not_implemented',
      },
      {
        title: 'Input Sanitization Beyond Zod',
        description: 'Zod validates structure but does not sanitize XSS content',
        status: 'not_implemented',
      },
    ],
  },
  {
    name: 'Reliability',
    icon: <Server className="w-4 h-4" />,
    items: [
      {
        title: 'Health Check Alerting',
        description: '/health endpoint exists but nothing monitors it',
        status: 'not_implemented',
      },
      {
        title: 'Paid Hosting Tier',
        description: 'Render free tier has cold start delays and limited resources',
        status: 'not_implemented',
      },
    ],
  },
  {
    name: 'Data',
    icon: <Database className="w-4 h-4" />,
    items: [
      {
        title: 'Screenshot Storage Redundancy',
        description: 'Screenshots stored as URLs only — if external sources go down, data is lost',
        status: 'not_implemented',
      },
    ],
  },
];

export function AuditGaps() {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalItems = auditData.reduce((sum, cat) => sum + cat.items.length, 0);
  const notImplemented = auditData.reduce(
    (sum, cat) => sum + cat.items.filter((i) => i.status === 'not_implemented').length,
    0
  );
  const partial = totalItems - notImplemented;

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900">
              Architecture Audit Gaps
            </h3>
            <p className="text-xs text-gray-500">
              {totalItems} items &mdash; {notImplemented} not implemented, {partial} partial
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-6">
          {auditData.map((category) => (
            <div key={category.name}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-500">{category.icon}</span>
                <h4 className="text-sm font-medium text-gray-700">{category.name}</h4>
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {category.items.length}
                </span>
              </div>
              <div className="space-y-2">
                {category.items.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap mt-0.5 ${
                        item.status === 'not_implemented'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {item.status === 'not_implemented' ? 'Not Implemented' : 'Partial'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
