'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ProjectContextType {
  projectName: string | null;
  setProjectName: (name: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectName, setProjectName] = useState<string | null>(null);

  return (
    <ProjectContext.Provider value={{ projectName, setProjectName }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}