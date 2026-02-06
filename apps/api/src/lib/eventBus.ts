import { EventEmitter } from 'events';

// Simple in-process event bus for SSE
// Keyed by projectId -> set of response writers
const emitter = new EventEmitter();
emitter.setMaxListeners(100);

export type IssueEvent = {
  type: 'issue:created' | 'issue:updated' | 'issue:deleted';
  projectId: string;
  data: Record<string, unknown>;
};

export function emitIssueEvent(event: IssueEvent) {
  emitter.emit(`project:${event.projectId}`, event);
}

export function onIssueEvent(projectId: string, listener: (event: IssueEvent) => void) {
  emitter.on(`project:${projectId}`, listener);
  return () => {
    emitter.off(`project:${projectId}`, listener);
  };
}
