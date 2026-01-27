export type BugReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type BugReportPriority = 'low' | 'medium' | 'high' | 'critical';
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
}

export interface BugReport {
  id: string;
  title: string;
  description: string;
  url: string;
  screenshotUrl: string;
  status: BugReportStatus;
  priority: BugReportPriority;
  environmentData: EnvironmentData;
  createdById: string;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnvironmentData {
  browser: string;
  browserVersion: string;
  os: string;
  screenResolution: string;
  viewportSize: string;
  url: string;
  pageTitle: string;
  userAgent: string;
  timestamp: string;
  timezone: string;
  consoleErrors?: string[];
  networkRequests?: string[];
}

export interface Annotation {
  id: string;
  reportId: string;
  type: 'pen' | 'highlighter' | 'rectangle' | 'text' | 'arrow';
  coordinates: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  content?: string;
  color?: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  reportId: string;
  userId: string;
  content: string;
  createdAt: Date;
}