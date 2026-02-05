import { EventEmitter } from 'events';

// Simple in-process event bus for SSE
// Keyed by projectId -> set of response writers
const emitter = new EventEmitter();
emitter.setMaxListeners(100);

export type TaskEvent = {
  type: 'task:created' | 'task:updated' | 'task:deleted';
  projectId: string;
  data: Record<string, unknown>;
};

export function emitTaskEvent(event: TaskEvent) {
  emitter.emit(`project:${event.projectId}`, event);
}

export function onTaskEvent(projectId: string, listener: (event: TaskEvent) => void) {
  emitter.on(`project:${projectId}`, listener);
  return () => {
    emitter.off(`project:${projectId}`, listener);
  };
}
