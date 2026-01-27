'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description?: string;
  websiteUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setProject(data);
          setEditedName(data.name);
          setEditedDescription(data.description || '');
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    };

    fetchProject();
  }, [projectId]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
      descriptionInputRef.current.select();
    }
  }, [isEditingDescription]);

  // Save project name
  const saveProjectName = async () => {
    if (!editedName.trim() || editedName === project?.name) {
      setIsEditingName(false);
      setEditedName(project?.name || '');
      return;
    }

    setIsSavingName(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: editedName.trim() }),
        }
      );

      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);
        setEditedName(updatedProject.name);
      }
    } catch (error) {
      console.error('Error updating project name:', error);
      setEditedName(project?.name || '');
    } finally {
      setIsSavingName(false);
      setIsEditingName(false);
    }
  };

  // Save project description
  const saveProjectDescription = async () => {
    if (editedDescription === project?.description) {
      setIsEditingDescription(false);
      return;
    }

    setIsSavingDescription(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ description: editedDescription.trim() }),
        }
      );

      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);
        setEditedDescription(updatedProject.description || '');
      }
    } catch (error) {
      console.error('Error updating project description:', error);
      setEditedDescription(project?.description || '');
    } finally {
      setIsSavingDescription(false);
      setIsEditingDescription(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveProjectName();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setEditedName(project?.name || '');
    }
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditingDescription(false);
      setEditedDescription(project?.description || '');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </Link>
        
        {/* Editable Project Name */}
        <div className="flex items-center gap-3 mb-2">
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={saveProjectName}
              onKeyDown={handleNameKeyDown}
              className="text-3xl font-bold text-gray-900 border-2 border-indigo-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              disabled={isSavingName}
            />
          ) : (
            <h1
              className="text-3xl font-bold text-gray-900 cursor-text hover:text-indigo-600 transition-colors group flex items-center gap-2"
              onClick={() => setIsEditingName(true)}
            >
              {project?.name || 'Loading...'}
              <svg
                className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </h1>
          )}
          {isSavingName && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          )}
        </div>
        <p className="text-gray-500 text-sm mt-2">Project ID: {projectId}</p>
        
        {/* Editable Project Description */}
        <div className="flex items-center gap-3 mt-3">
          {isEditingDescription ? (
            <textarea
              ref={descriptionInputRef}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              onBlur={saveProjectDescription}
              onKeyDown={handleDescriptionKeyDown}
              className="w-full text-base text-gray-700 border-2 border-indigo-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
              rows={3}
              disabled={isSavingDescription}
            />
          ) : (
            <p
              className="text-base text-gray-700 cursor-text hover:text-indigo-600 transition-colors group flex items-start gap-2"
              onClick={() => setIsEditingDescription(true)}
            >
              <span className="flex-1">
                {project?.description || 'Click to add a description...'}
              </span>
              <svg
                className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </p>
          )}
          {isSavingDescription && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Project View</h3>
        <p className="text-gray-600 mb-6">
          This is a placeholder for the project detail view. Here you can manage bug reports, team members, and project settings.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href={`/dashboard/projects/${projectId}/annotate`}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Annotate Webpage
          </Link>
          <Link
            href="/dashboard/reports/new"
            className="px-6 py-2 bg-white text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Create Bug Report
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    </div>
  );
}