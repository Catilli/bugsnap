'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useProject } from '../../ProjectContext';

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const { setProjectName } = useProject();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

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
          setProjectName(data.name);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    };

    fetchProject();

    // Cleanup: Clear project name when leaving the page
    return () => {
      setProjectName(null);
    };
  }, [projectId, setProjectName]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

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
        setProjectName(updatedProject.name);
      }
    } catch (error) {
      console.error('Error updating project name:', error);
      setEditedName(project?.name || '');
    } finally {
      setIsSavingName(false);
      setIsEditingName(false);
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

  return (
    <div>
      <div className="mb-8">
        {/* Project Title and Actions */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
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

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <a
              href={project?.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-indigo-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Open website
            </a>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-2">
          Project ID: {projectId}
        </p>
      </div>

      {/* Tasks will be displayed here */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tasks</h2>
        <p className="text-gray-500 text-center py-8">
          Task management coming soon...
        </p>
      </div>
    </div>
  );
}