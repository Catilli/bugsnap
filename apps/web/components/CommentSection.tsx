'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { authFetch } from '../lib/api';
import { useCurrentUser } from '../lib/useCurrentUser';
import { useRole } from '../lib/useRole';
import MentionTextarea from './MentionTextarea';

interface MentionedUser {
  id: string;
  name: string;
  email: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  mentionedUserIds?: string[];
  mentionedUsers?: MentionedUser[];
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ProjectMember {
  id: string;
  name: string;
  email: string;
}

interface CommentSectionProps {
  issueId?: string | null;
  feedbackId?: string | null;
  onCommentCountChange?: (count: number) => void;
  projectMembers?: ProjectMember[];
}

export default function CommentSection({ issueId, feedbackId, onCommentCountChange, projectMembers = [] }: CommentSectionProps) {
  const { isViewer } = useRole();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newMentionIds, setNewMentionIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editMentionIds, setEditMentionIds] = useState<string[]>([]);
  const user = useCurrentUser();

  const renderCommentContent = (content: string, mentionedUsers?: MentionedUser[]): React.ReactNode => {
    const mentionMap = new Map<string, MentionedUser>();
    if (mentionedUsers) {
      for (const u of mentionedUsers) {
        mentionMap.set(u.name.toLowerCase(), u);
      }
    }

    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (/^@\w+/.test(part)) {
        const name = part.slice(1);
        const mentionedUser = mentionMap.get(name.toLowerCase());
        if (mentionedUser) {
          return (
            <span
              key={i}
              className="text-indigo-600 font-medium bg-indigo-50 px-1 rounded cursor-default"
              title={mentionedUser.email}
            >
              {part}
            </span>
          );
        }
        // Mentioned user not found (removed from project)
        return (
          <span
            key={i}
            className="text-gray-400 font-medium bg-gray-100 px-1 rounded cursor-default"
            title="User not found"
          >
            {part}
          </span>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  const entityId = issueId || feedbackId;
  const basePath = issueId ? `issues/${issueId}` : `feedback/${feedbackId}`;

  useEffect(() => {
    if (entityId) {
      fetchComments();
    }
  }, [entityId]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchComments = async () => {
    if (!entityId) return;

    try {
      const response = await authFetch(`${apiUrl}/api/${basePath}/comments`);

      if (response.ok) {
        const data = await response.json();
        setComments(data);
        onCommentCountChange?.(data.length);
      }
    } catch {
      // Silently fail
    }
  };

  const handleAddComment = async () => {
    if (!entityId || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await authFetch(`${apiUrl}/api/${basePath}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          mentionedUserIds: newMentionIds,
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        const updated = [...comments, comment];
        setComments(updated);
        setNewComment('');
        setNewMentionIds([]);
        onCommentCountChange?.(updated.length);
      }
    } catch {
      // Silently fail
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await authFetch(`${apiUrl}/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent.trim(),
          mentionedUserIds: editMentionIds,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setComments(comments.map((c) => (c.id === commentId ? updated : c)));
        setEditingId(null);
        setEditContent('');
        setEditMentionIds([]);
      }
    } catch {
      // Silently fail
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const response = await authFetch(`${apiUrl}/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updated = comments.filter((c) => c.id !== commentId);
        setComments(updated);
        onCommentCountChange?.(updated.length);
      }
    } catch {
      // Silently fail
    }
  };

  const handleNewCommentChange = useCallback((val: string, ids: string[]) => {
    setNewComment(val);
    setNewMentionIds(ids);
  }, []);

  const handleEditCommentChange = useCallback((val: string, ids: string[]) => {
    setEditContent(val);
    setEditMentionIds(ids);
  }, []);

  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Comments ({comments.length})
      </h3>

      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => {
            const isOwn = user?.id === comment.user.id;
            const isEditing = editingId === comment.id;

            return (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                  {comment.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{comment.user.name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                    {isOwn && !isEditing && (
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditContent(comment.content);
                            setEditMentionIds(comment.mentionedUserIds || []);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div>
                      <MentionTextarea
                        value={editContent}
                        onChange={handleEditCommentChange}
                        projectMembers={projectMembers}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y text-sm"
                      />
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => handleEditComment(comment.id)}
                          disabled={!editContent.trim()}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" /> Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditContent('');
                            setEditMentionIds([]);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700">
                      {renderCommentContent(comment.content, comment.mentionedUsers)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No comments yet</p>
      )}

      {/* Add comment form — hidden for VIEWER */}
      {!isViewer && (
        <div className="mt-4">
          <MentionTextarea
            value={newComment}
            onChange={handleNewCommentChange}
            projectMembers={projectMembers}
            placeholder="Add a comment... (use @name to mention)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
          <button
            onClick={handleAddComment}
            disabled={isSubmitting || !newComment.trim()}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : 'Add Comment'}
          </button>
        </div>
      )}
    </div>
  );
}
