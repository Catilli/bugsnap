'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { getAuthToken } from '../lib/clerkTokenBridge';
import { useCurrentUser } from '../lib/useCurrentUser';
import { useRole } from '../lib/useRole';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<ProjectMember[]>([]);
  const user = useCurrentUser();

  const entityId = issueId || feedbackId;
  const basePath = issueId ? `issues/${issueId}` : `feedback/${feedbackId}`;

  useEffect(() => {
    if (entityId) {
      fetchComments();
    }
  }, [entityId]);

  const getHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchComments = async () => {
    if (!entityId) return;

    try {
      const response = await fetch(`${apiUrl}/api/${basePath}/comments`, {
        headers: getHeaders(),
      });

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
      const response = await fetch(`${apiUrl}/api/${basePath}/comments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.ok) {
        const comment = await response.json();
        const updated = [...comments, comment];
        setComments(updated);
        setNewComment('');
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
      const response = await fetch(`${apiUrl}/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (response.ok) {
        const updated = await response.json();
        setComments(comments.map((c) => (c.id === commentId ? updated : c)));
        setEditingId(null);
        setEditContent('');
      }
    } catch {
      // Silently fail
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const response = await fetch(`${apiUrl}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: getHeaders(),
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
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y text-sm"
                        rows={2}
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
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700">{comment.content}</p>
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
        <div className="mt-4 relative">
          <textarea
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
              // Detect @mention
              const text = e.target.value;
              const cursorPos = e.target.selectionStart;
              const textBefore = text.slice(0, cursorPos);
              const mentionMatch = textBefore.match(/@(\w*)$/);
              if (mentionMatch && projectMembers.length > 0) {
                const query = mentionMatch[1].toLowerCase();
                setMentionQuery(query);
                setMentionResults(
                  projectMembers.filter(m =>
                    m.name.toLowerCase().includes(query)
                  ).slice(0, 5)
                );
              } else {
                setMentionQuery(null);
                setMentionResults([]);
              }
            }}
            placeholder="Add a comment... (use @name to mention)"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            rows={3}
          />
          {/* @Mention autocomplete dropdown */}
          {mentionQuery !== null && mentionResults.length > 0 && (
            <div className="absolute bottom-full mb-1 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {mentionResults.map(member => (
                <button
                  key={member.id}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    // Replace the @query with @name
                    const regex = new RegExp(`@${mentionQuery}$`);
                    setNewComment(prev => {
                      const before = prev.slice(0, prev.length);
                      return before.replace(regex, `@${member.name} `);
                    });
                    setMentionQuery(null);
                    setMentionResults([]);
                  }}
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-900">{member.name}</span>
                </button>
              ))}
            </div>
          )}
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
