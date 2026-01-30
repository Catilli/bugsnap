interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'critical' | null | undefined;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const getPriorityStyles = () => {
    const styles = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
      none: 'bg-gray-50 text-gray-500',
    };
    return styles[priority || 'none'];
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const displayText = priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'None';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${getPriorityStyles()} ${sizeClasses[size]}`}
    >
      {displayText}
    </span>
  );
}