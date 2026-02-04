import { Bug, Lightbulb, CheckSquare } from 'lucide-react';

interface TypeBadgeProps {
  type: 'BUG' | 'FEATURE' | 'TASK';
  size?: 'sm' | 'md';
}

export function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
  const getTypeStyles = () => {
    const styles = {
      BUG: 'bg-red-100 text-red-800',
      FEATURE: 'bg-purple-100 text-purple-800',
      TASK: 'bg-gray-100 text-gray-800',
    };
    return styles[type];
  };

  const getIcon = () => {
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    const icons = {
      BUG: <Bug className={iconSize} />,
      FEATURE: <Lightbulb className={iconSize} />,
      TASK: <CheckSquare className={iconSize} />,
    };
    return icons[type];
  };

  const getLabel = () => {
    const labels = {
      BUG: 'Bug',
      FEATURE: 'Feature',
      TASK: 'Task',
    };
    return labels[type];
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${getTypeStyles()} ${sizeClasses[size]}`}
    >
      {getIcon()}
      {getLabel()}
    </span>
  );
}
