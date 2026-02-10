import { EventEmitter } from 'events';

// Simple in-process event bus for SSE
// Keyed by projectId -> set of response writers
const emitter = new EventEmitter();
emitter.setMaxListeners(100);

// --- Issue events (project-scoped) ---

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

// --- Feedback events (global channel) ---

export type FeedbackEvent = {
  type: 'feedback:created' | 'feedback:updated' | 'feedback:deleted';
  data: Record<string, unknown>;
};

export function emitFeedbackEvent(event: FeedbackEvent) {
  emitter.emit('feedback', event);
}

export function onFeedbackEvent(listener: (event: FeedbackEvent) => void) {
  emitter.on('feedback', listener);
  return () => {
    emitter.off('feedback', listener);
  };
}

// --- QA Cycle events (project-scoped, reuses project channel) ---

export type QACycleEvent = {
  type: 'qacycle:created' | 'qacycle:updated' | 'qacycle:deleted' | 'qacycle:issue_added' | 'qacycle:issue_removed';
  projectId: string;
  data: Record<string, unknown>;
};

export function emitQACycleEvent(event: QACycleEvent) {
  emitter.emit(`project:${event.projectId}`, event);
}
