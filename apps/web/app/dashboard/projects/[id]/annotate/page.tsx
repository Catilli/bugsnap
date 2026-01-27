'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type AnnotationTool = 'select' | 'pen' | 'highlighter' | 'rectangle' | 'text' | 'arrow';

interface Annotation {
  id: string;
  type: AnnotationTool;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: string;
  text?: string;
  path?: { x: number; y: number }[];
}

interface Comment {
  id: string;
  user: string;
  content: string;
  timestamp: Date;
  x?: number;
  y?: number;
}

export default function AnnotatePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loadedUrl, setLoadedUrl] = useState('');
  const [currentTool, setCurrentTool] = useState<AnnotationTool>('select');
  const [currentColor, setCurrentColor] = useState('#FF0000');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });
  const [commentText, setCommentText] = useState('');
  const [showBugReportModal, setShowBugReportModal] = useState(false);
  const [bugReportData, setBugReportData] = useState({
    title: '',
    description: '',
    priority: 'medium',
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const tools: { type: AnnotationTool; icon: string; label: string }[] = [
    { type: 'select', icon: '↖️', label: 'Select' },
    { type: 'pen', icon: '✏️', label: 'Pen' },
    { type: 'highlighter', icon: '🖍️', label: 'Highlighter' },
    { type: 'rectangle', icon: '▭', label: 'Rectangle' },
    { type: 'text', icon: 'T', label: 'Text' },
    { type: 'arrow', icon: '→', label: 'Arrow' },
  ];

  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

  const loadWebsite = () => {
    if (websiteUrl) {
      setLoadedUrl(websiteUrl);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === 'select') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPos({ x, y });
    setIsDrawing(true);

    if (currentTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          type: 'text',
          x,
          y,
          color: currentColor,
          text,
        };
        setAnnotations([...annotations, newAnnotation]);
      }
      setIsDrawing(false);
    } else if (currentTool === 'pen') {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'pen',
        x,
        y,
        color: currentColor,
        path: [{ x, y }],
      };
      setAnnotations([...annotations, newAnnotation]);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentTool === 'select') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'pen') {
      const lastAnnotation = annotations[annotations.length - 1];
      if (lastAnnotation && lastAnnotation.path) {
        lastAnnotation.path.push({ x, y });
        setAnnotations([...annotations]);
      }
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentTool === 'select') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'rectangle' || currentTool === 'highlighter') {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: currentTool,
        x: Math.min(startPos.x, x),
        y: Math.min(startPos.y, y),
        width: Math.abs(x - startPos.x),
        height: Math.abs(y - startPos.y),
        color: currentColor,
      };
      setAnnotations([...annotations, newAnnotation]);
    } else if (currentTool === 'arrow') {
      // Simple arrow implementation
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'arrow',
        x: startPos.x,
        y: startPos.y,
        width: x,
        height: y,
        color: currentColor,
      };
      setAnnotations([...annotations, newAnnotation]);
    }

    setIsDrawing(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === 'select') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setCommentPosition({ x, y });
      setShowCommentBox(true);
    }
  };

  const addComment = () => {
    if (commentText.trim()) {
      const newComment: Comment = {
        id: Date.now().toString(),
        user: 'Current User', // Replace with actual user
        content: commentText,
        timestamp: new Date(),
        x: commentPosition.x,
        y: commentPosition.y,
      };
      setComments([...comments, newComment]);
      setCommentText('');
      setShowCommentBox(false);
    }
  };

  const submitBugReport = () => {
    // In a real app, this would send to API
    console.log('Bug Report:', {
      projectId,
      url: loadedUrl,
      ...bugReportData,
      annotations,
      comments,
    });
    setShowBugReportModal(false);
    alert('Bug report submitted successfully!');
  };

  const clearAnnotations = () => {
    setAnnotations([]);
  };

  const undoLastAnnotation = () => {
    setAnnotations(annotations.slice(0, -1));
  };

  // Render annotations on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = annotation.type === 'highlighter' ? 10 : 2;

      switch (annotation.type) {
        case 'rectangle':
          if (annotation.width && annotation.height) {
            ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
          }
          break;
        case 'highlighter':
          if (annotation.width && annotation.height) {
            ctx.globalAlpha = 0.3;
            ctx.fillRect(annotation.x, annotation.y, annotation.width, annotation.height);
            ctx.globalAlpha = 1.0;
          }
          break;
        case 'text':
          ctx.font = '16px Arial';
          ctx.fillText(annotation.text || '', annotation.x, annotation.y);
          break;
        case 'pen':
          if (annotation.path && annotation.path.length > 1) {
            ctx.beginPath();
            ctx.moveTo(annotation.path[0].x, annotation.path[0].y);
            annotation.path.forEach((point) => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          }
          break;
        case 'arrow':
          if (annotation.width !== undefined && annotation.height !== undefined) {
            ctx.beginPath();
            ctx.moveTo(annotation.x, annotation.y);
            ctx.lineTo(annotation.width, annotation.height);
            ctx.stroke();
            // Arrow head
            const angle = Math.atan2(annotation.height - annotation.y, annotation.width - annotation.x);
            const headLength = 15;
            ctx.beginPath();
            ctx.moveTo(annotation.width, annotation.height);
            ctx.lineTo(
              annotation.width - headLength * Math.cos(angle - Math.PI / 6),
              annotation.height - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(annotation.width, annotation.height);
            ctx.lineTo(
              annotation.width - headLength * Math.cos(angle + Math.PI / 6),
              annotation.height - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
          break;
      }
    });

    // Draw comment markers
    comments.forEach((comment) => {
      if (comment.x !== undefined && comment.y !== undefined) {
        ctx.fillStyle = '#4F46E5';
        ctx.beginPath();
        ctx.arc(comment.x, comment.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💬', comment.x, comment.y + 4);
      }
    });
  }, [annotations, comments]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Annotate Webpage</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="Enter website URL..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 w-96"
                onKeyDown={(e) => e.key === 'Enter' && loadWebsite()}
              />
              <button
                onClick={loadWebsite}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Load
              </button>
            </div>

            <button
              onClick={() => setShowBugReportModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Submit Bug Report
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-6">
          {/* Tools */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Tools:</span>
            {tools.map((tool) => (
              <button
                key={tool.type}
                onClick={() => setCurrentTool(tool.type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTool === tool.type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                title={tool.label}
              >
                <span className="mr-1">{tool.icon}</span>
                {tool.label}
              </button>
            ))}
          </div>

          {/* Colors */}
          <div className="flex items-center gap-2 border-l border-gray-300 pl-6">
            <span className="text-sm font-medium text-gray-700 mr-2">Color:</span>
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                className={`w-8 h-8 rounded-full border-2 ${
                  currentColor === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 border-l border-gray-300 pl-6 ml-auto">
            <button
              onClick={undoLastAnnotation}
              className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium"
            >
              Undo
            </button>
            <button
              onClick={clearAnnotations}
              className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Webpage with canvas overlay */}
        <div className="flex-1 relative bg-gray-100">
          {loadedUrl ? (
            <div className="relative w-full h-full">
              <iframe
                ref={iframeRef}
                src={loadedUrl}
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
              <canvas
                ref={canvasRef}
                width={1920}
                height={1080}
                className="absolute top-0 left-0 w-full h-full pointer-events-auto cursor-crosshair"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onClick={handleCanvasClick}
                style={{ cursor: currentTool === 'select' ? 'pointer' : 'crosshair' }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg
                  className="w-24 h-24 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No webpage loaded</h3>
                <p className="text-gray-500">Enter a URL above to start annotating</p>
              </div>
            </div>
          )}
        </div>

        {/* Comments Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Comments ({comments.length})</h2>
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-sm text-gray-900">{comment.user}</span>
                    <span className="text-xs text-gray-500">
                      {comment.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  No comments yet. Use the Select tool to add comments.
                </p>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Annotations ({annotations.length})
              </h3>
              <div className="space-y-2">
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="flex items-center justify-between bg-gray-50 rounded p-2 text-xs"
                  >
                    <span className="text-gray-700 capitalize">{annotation.type}</span>
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: annotation.color }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comment Input Modal */}
      {showCommentBox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Comment</h3>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Enter your comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mb-4"
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCommentBox(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={addComment}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bug Report Modal */}
      {showBugReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[32rem]">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Submit Bug Report</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={bugReportData.title}
                  onChange={(e) => setBugReportData({ ...bugReportData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Brief description of the bug"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={bugReportData.description}
                  onChange={(e) =>
                    setBugReportData({ ...bugReportData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                  placeholder="Detailed description of the issue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={bugReportData.priority}
                  onChange={(e) => setBugReportData({ ...bugReportData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  <strong>Annotations:</strong> {annotations.length}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Comments:</strong> {comments.length}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>URL:</strong> {loadedUrl}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowBugReportModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={submitBugReport}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}