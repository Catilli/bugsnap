'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin, ExternalLink, Share2, Check, Paperclip, Upload, FileText, Image, Film, Trash2, ChevronDown, UserX } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { TypeBadge } from './TypeBadge';
import ButtonDropdown from './ButtonDropdown';
import CommentSection from './CommentSection';
import ActivityTimeline from './ActivityTimeline';
import Drawer from './Drawer';
import { authFetch } from '../lib/api';
import { useRole } from '../lib/useRole';
import { useAuthStore } from '../store/authStore';
import { RoleGate } from './RoleGate';

interface IssueDrawerProps {
  issueId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange?: (issueId: string, count: number) => void;
}

interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  url: string | null;
  screenshotUrl: string | null;
  status: 'open' | 'in_progress' | 'qa' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical' | null;
  severity?: 'low' | 'medium' | 'high' | 'critical' | null;
  type?: 'BUG' | 'FEATURE' | 'TASK';
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
  environmentData?: {
    browser?: string;
    os?: string;
    timestamp?: string;
    screenResolution?: string;
    viewportSize?: string;
    deviceType?: string;
    reporterEmail?: string;
    selectedElement?: any;
  };
  annotations?: any[];
  _count: {
    comments: number;
  };
}

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export default function IssueDrawer({ issueId, isOpen, onClose, onCommentCountChange }: IssueDrawerProps) {
  const { role, hasRole, isViewer } = useRole();
  const currentUser = useAuthStore((s) => s.user);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScreenshotEnlarged, setIsScreenshotEnlarged] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAssignPicker, setShowAssignPicker] = useState(false);
  const [projectMembers, setProjectMembers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const fetchProjectMembers = async (projectId: string) => {
    setIsLoadingMembers(true);
    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}/members`,
      );
      if (response.ok) {
        const data = await response.json();
        const members: { id: string; name: string; email: string }[] = [];
        if (data.owner) members.push(data.owner);
        if (data.members) {
          for (const m of data.members) {
            if (m.user && !members.some((existing) => existing.id === m.user.id)) {
              members.push(m.user);
            }
          }
        }
        setProjectMembers(members);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleAssignClick = () => {
    if (!issue) return;
    setShowAssignPicker(true);
    if (projectMembers.length === 0) {
      fetchProjectMembers(issue.projectId);
    }
  };

  const handleSelectAssignee = (memberId: string | null) => {
    updateIssue('assignedToId', memberId);
    setShowAssignPicker(false);
  };

  // Extract issue/bug/feature number from title
  const getIssueNumber = (title: string) => {
    const match = title.match(/^(Bug|Feature|Task) #(\d+)/);
    return match ? match[2] : null;
  };

  // Get type prefix from title
  const getTypePrefix = (title: string) => {
    const match = title.match(/^(Bug|Feature|Task) #/);
    return match ? match[1] : 'Task';
  };

  // Remove issue number prefix from title
  const getCleanTitle = (title: string) => {
    return title.replace(/^(Bug|Feature|Task) #\d+\s*-\s*/, '');
  };

  // Format status for display (capitalize and replace underscores)
  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Format date as "Jan 30, 2026 at 3:27am"
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12

    return `${month} ${day}, ${year} at ${hours}:${minutes}${ampm}`;
  };

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'qa', label: 'QA' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  // Fetch issue details when drawer opens
  useEffect(() => {
    if (isOpen && issueId) {
      fetchIssueDetails();
    }
  }, [isOpen, issueId]);

  const fetchIssueDetails = async () => {
    if (!issueId) return;

    setIsLoading(true);
    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/issues/${issueId}`,
      );

      if (response.ok) {
        const data = await response.json();
        setIssue(data);
      }
    } catch (error) {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const updateIssue = async (field: string, value: any) => {
    if (!issueId || !issue) return;

    setIsSaving(true);
    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/issues/${issueId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        }
      );

      if (response.ok) {
        const updatedIssue = await response.json();
        setIssue(updatedIssue);
      }
    } catch (error) {
      // Silently fail
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!issueId) return;
    setIsSharing(true);
    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/issues/${issueId}/share`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expiresInDays: 7 }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        const link = `${window.location.origin}/shared/${data.token}`;
        setShareLink(link);
        await navigator.clipboard.writeText(link);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      // Silently fail
    } finally {
      setIsSharing(false);
    }
  };

  // Fetch attachments when issue loads
  useEffect(() => {
    if (isOpen && issueId) {
      fetchAttachments();
    }
  }, [isOpen, issueId]);

  const fetchAttachments = async () => {
    if (!issueId) return;
    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/issues/${issueId}/attachments`,
      );
      if (response.ok) {
        setAttachments(await response.json());
      }
    } catch {
      // Silently fail
    }
  };

  const uploadAttachment = async (file: File) => {
    if (!issueId) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/issues/${issueId}/attachments`,
        {
          method: 'POST',
          body: formData,
        }
      );
      if (response.ok) {
        const attachment = await response.json();
        setAttachments((prev) => [attachment, ...prev]);
      }
    } catch {
      // Silently fail
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadAttachment(files[0]);
  }, [issueId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType.startsWith('video/')) return <Film className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        isLoading={isLoading}
        notFound={!issue}
        notFoundMessage="Issue not found"
        header={
          <>
            <span className="text-sm text-gray-500">
              {issue?.title ? `${getTypePrefix(issue.title)} #${getIssueNumber(issue.title) || '1'}` : '...'}
            </span>
            {issue?.type && issue.type !== 'TASK' && <TypeBadge type={issue.type} size="sm" />}
            {issue?.status && <StatusBadge status={issue.status} size="sm" />}
          </>
        }
        headerActions={
          hasRole('MANAGER') ? (
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-indigo-600"
              title={shareCopied ? 'Link copied!' : 'Share issue'}
            >
              {shareCopied ? <Check className="w-5 h-5 text-green-600" /> : <Share2 className="w-5 h-5" />}
            </button>
          ) : undefined
        }
      >
        {issue && <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              {isViewer ? (
                <h2 className="text-2xl font-semibold text-gray-900">{getCleanTitle(issue.title)}</h2>
              ) : (
                <input
                  type="text"
                  value={getCleanTitle(issue.title)}
                  onChange={(e) => {
                    const issueNumber = getIssueNumber(issue.title);
                    const typePrefix = getTypePrefix(issue.title);
                    const newTitle = issueNumber ? `${typePrefix} #${issueNumber} - ${e.target.value}` : e.target.value;
                    setIssue({ ...issue, title: newTitle });
                  }}
                  onBlur={(e) => {
                    const issueNumber = getIssueNumber(issue.title);
                    const typePrefix = getTypePrefix(issue.title);
                    const newTitle = issueNumber ? `${typePrefix} #${issueNumber} - ${e.target.value}` : e.target.value;
                    updateIssue('title', newTitle);
                  }}
                  className="text-2xl font-semibold text-gray-900 w-full border-none focus:outline-none focus:ring-0 px-0"
                  placeholder="Issue title"
                />
              )}
            </div>

            {/* Description */}
            <div>
              {isViewer ? (
                <p className="text-gray-600">{issue.description || 'No description'}</p>
              ) : (
                <textarea
                  value={issue.description || ''}
                  onChange={(e) => {
                    setIssue({ ...issue, description: e.target.value });
                  }}
                  onBlur={(e) => updateIssue('description', e.target.value)}
                  className="text-gray-600 w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  placeholder="Add description..."
                  rows={3}
                />
              )}
            </div>

            {/* Status — VIEWER sees read-only, DEVELOPER can change on own/assigned only */}
            <div>
              {(() => {
                const isCreator = issue.createdBy?.id === currentUser?.id;
                const isAssignee = issue.assignedTo?.id === currentUser?.id;
                const canChangeStatus = hasRole('MANAGER') || (role === 'DEVELOPER' && (isCreator || isAssignee));

                if (canChangeStatus) {
                  return (
                    <ButtonDropdown
                      label={`Mark as ${formatStatus(issue.status)}`}
                      options={statusOptions}
                      selectedValue={issue.status}
                      onChange={(value) => updateIssue('status', value)}
                    />
                  );
                }

                return (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <StatusBadge status={issue.status} />
                  </div>
                );
              })()}
            </div>

            {/* Screenshot */}
            {issue.screenshotUrl && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Screenshot</label>
                </div>
                <div
                  className="relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer group h-96"
                  onClick={() => setIsScreenshotEnlarged(true)}
                >
                  <img
                    src={issue.screenshotUrl}
                    alt="Screenshot"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                    <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to enlarge
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            {issue.url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <a
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm break-all"
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{issue.url}</span>
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                </a>
              </div>
            )}

            {/* Priority & Severity — MANAGER+ can edit, others see read-only */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                {hasRole('MANAGER') ? (
                  <select
                    value={issue.priority || ''}
                    onChange={(e) => updateIssue('priority', e.target.value || null)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  >
                    <option value="">Not Set</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                ) : (
                  <span className="text-sm text-gray-600 capitalize">{issue.priority || 'Not set'}</span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                {hasRole('MANAGER') ? (
                  <select
                    value={issue.severity || ''}
                    onChange={(e) => updateIssue('severity', e.target.value || null)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  >
                    <option value="">Not Set</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                ) : (
                  <span className="text-sm text-gray-600 capitalize">{issue.severity || 'Not set'}</span>
                )}
              </div>
            </div>

            {/* Assigned To — MANAGER+ can assign, others see read-only */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
              {issue.assignedTo ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                    {issue.assignedTo.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{issue.assignedTo.name}</div>
                    <div className="text-xs text-gray-500">{issue.assignedTo.email}</div>
                  </div>
                  {hasRole('MANAGER') && (
                    <button
                      onClick={handleAssignClick}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Change
                    </button>
                  )}
                </div>
              ) : hasRole('MANAGER') ? (
                <button
                  onClick={handleAssignClick}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors text-left"
                >
                  + Assign user
                </button>
              ) : (
                <span className="text-sm text-gray-500">Unassigned</span>
              )}

              {/* Member picker dropdown */}
              {showAssignPicker && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowAssignPicker(false)} />
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                    {isLoadingMembers ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                      </div>
                    ) : (
                      <>
                        {issue.assignedTo && (
                          <button
                            onClick={() => handleSelectAssignee(null)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-sm text-red-600 border-b border-gray-100"
                          >
                            <UserX className="w-4 h-4" />
                            Unassign
                          </button>
                        )}
                        {projectMembers.map((member) => (
                          <button
                            key={member.id}
                            onClick={() => handleSelectAssignee(member.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 text-left ${
                              issue.assignedTo?.id === member.id ? 'bg-indigo-50' : ''
                            }`}
                          >
                            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{member.name}</div>
                              <div className="text-xs text-gray-500 truncate">{member.email}</div>
                            </div>
                            {issue.assignedTo?.id === member.id && (
                              <Check className="w-4 h-4 text-indigo-600 ml-auto flex-shrink-0" />
                            )}
                          </button>
                        ))}
                        {projectMembers.length === 0 && !isLoadingMembers && (
                          <div className="px-3 py-4 text-sm text-gray-500 text-center">No members found</div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Environment Info */}
            {issue.environmentData && (issue.environmentData.screenResolution || issue.environmentData.viewportSize || issue.environmentData.deviceType) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                  {issue.environmentData.deviceType && (
                    <div><span className="font-medium text-gray-700">Device:</span> {issue.environmentData.deviceType}</div>
                  )}
                  {issue.environmentData.screenResolution && (
                    <div><span className="font-medium text-gray-700">Screen:</span> {issue.environmentData.screenResolution}</div>
                  )}
                  {issue.environmentData.viewportSize && (
                    <div><span className="font-medium text-gray-700">Viewport:</span> {issue.environmentData.viewportSize}</div>
                  )}
                  {issue.environmentData.os && (
                    <div><span className="font-medium text-gray-700">OS:</span> {issue.environmentData.os}</div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-xs text-gray-500">
                Reported {formatDateTime(issue.createdAt)}, by {issue.createdBy.name}
              </p>
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">
                  Attachments {attachments.length > 0 && `(${attachments.length})`}
                </label>
              </div>

              {/* Drop zone — visible to non-viewers */}
              {!isViewer && (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors mb-3 ${
                    isDragOver
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadAttachment(file);
                      e.target.value = '';
                    }}
                  />
                  {isUploading ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                      Uploading...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <Upload className="w-4 h-4" />
                      Drop file here or click to upload
                    </div>
                  )}
                </div>
              )}

              {/* File list */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <span className="text-gray-400">{getFileIcon(att.fileType)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 truncate">{att.fileName}</div>
                        <div className="text-xs text-gray-500">{formatFileSize(att.fileSize)}</div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <CommentSection
              issueId={issueId}
              onCommentCountChange={(count) => onCommentCountChange?.(issueId!, count)}
            />

            {/* Activity Timeline */}
            <ActivityTimeline issueId={issueId} />
        </div>}
      </Drawer>

      {/* Screenshot Enlarged Modal */}
      {isScreenshotEnlarged && issue?.screenshotUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4"
          onClick={() => setIsScreenshotEnlarged(false)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setIsScreenshotEnlarged(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img
              src={issue.screenshotUrl}
              alt="Screenshot (enlarged)"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
