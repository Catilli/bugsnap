import { ReactNode } from 'react';

interface PageHeaderProps {
  /** Optional icon element displayed to the left of the title */
  icon?: ReactNode;
  /**
   * Page title — pass a string for default h1 styling, or a ReactNode
   * for custom rendering (e.g. editable/inline-rename titles).
   */
  title: ReactNode;
  /** Optional subtitle below the title */
  description?: string;
  /** Optional action element (button, link) aligned to the right */
  primaryAction?: ReactNode;
}

/**
 * Unified page header — title/description on the left, action on the right.
 *
 * Reuse on any dashboard page:
 *   <PageHeader title="Settings" description="Manage your account" />
 *   <PageHeader title="Tasks" primaryAction={<button>New Task</button>} />
 */
export function PageHeader({ icon, title, description, primaryAction }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          {typeof title === 'string' ? (
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          ) : (
            title
          )}
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      {primaryAction}
    </div>
  );
}
