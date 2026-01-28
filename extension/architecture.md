# BugSnap Extension Architecture

## System Architecture

### High-Level Overview

The BugSnap browser extension enables users to visually annotate web pages and create tasks directly from their browser. It consists of multiple components working together to provide a seamless experience.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Page      │    │  Content Script │    │ Background SW   │
│                 │◄──►│                 │◄──►│                 │
│ • Element       │    │ • Selection     │    │ • API Client    │
│ • Highlighting  │    │ • Overlay UI    │    │ • Auth          │
│ • Annotations   │    │ • Screenshot    │    │ • Data Sync     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲
                                │
                       ┌─────────────────┐
                       │   Popup UI      │
                       │                 │
                       │ • Project Sel   │
                       │ • Task Creation │
                       │ • Settings      │
                       └─────────────────┘
```

## Component Breakdown

### 1. Content Script (`content/`)

**Purpose**: Injects functionality into web pages for element selection and annotation.

**Key Files**:
- `content.js` - Main content script logic
- `overlay.css` - Visual styles for annotations
- `selector.js` - Element selection utilities

**Responsibilities**:
- Element selection and highlighting
- Annotation overlay management
- Screenshot capture
- User interaction handling
- Communication with background script

**Key Classes**:
```javascript
class ElementSelector {
  // Handles element selection logic
}

class AnnotationOverlay {
  // Manages visual annotations on page
}

class ScreenshotCapture {
  // Captures element screenshots
}
```

### 2. Background Service Worker (`background/`)

**Purpose**: Handles background tasks, API communication, and state management.

**Key Files**:
- `background.js` - Service worker logic
- `api.js` - API client utilities

**Responsibilities**:
- Authentication management
- API communication
- Data synchronization
- Extension state management
- Cross-origin request handling

**Key Classes**:
```javascript
class AuthManager {
  // JWT token management
}

class ApiClient {
  // REST API communication
}

class DataSync {
  // Local/remote data synchronization
}
```

### 3. Popup Interface (`popup/`)

**Purpose**: Provides quick access to extension controls and settings.

**Key Files**:
- `popup.html` - Popup HTML structure
- `popup.js` - Popup functionality
- `popup.css` - Popup styling

**Responsibilities**:
- Project selection
- Task creation workflow
- Authentication status display
- Settings access
- Quick actions

### 4. Options Page (`options/`)

**Purpose**: Extension configuration and advanced settings.

**Key Files**:
- `options.html` - Settings page HTML
- `options.js` - Settings functionality
- `options.css` - Settings styling

**Responsibilities**:
- API endpoint configuration
- Authentication setup
- Visual preferences
- Extension behavior settings

## Data Models

### Annotation
```javascript
interface Annotation {
  id: string;
  taskId: string;
  type: 'text' | 'arrow' | 'rectangle' | 'highlighter';
  coordinates: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  content?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Task
```javascript
interface Task {
  id: string;
  projectId: string;
  taskNumber: number;
  title: string;
  description?: string;
  url?: string;
  screenshotUrl?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  visibility: 'members' | 'members_and_clients';
  assignedToId?: string;
  createdById: string;
  annotations: Annotation[];
  comments: Comment[];
}
```

### Project
```javascript
interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  createdById: string;
  tasks: Task[];
}
```

## Communication Flow

### Extension Activation
1. User clicks extension icon
2. Popup opens, checks authentication
3. User selects project
4. Content script activates on current tab
5. Visual overlay appears

### Annotation Creation
1. User clicks element on web page
2. Content script highlights element
3. Annotation UI appears
4. User adds annotation details
5. Screenshot captured
6. Data sent to background script
7. API call to create task/annotation
8. Success feedback displayed

### Data Synchronization
1. Background script maintains local cache
2. Periodic sync with server
3. Conflict resolution for offline changes
4. Real-time updates for collaborative features

## Security Architecture

### Authentication
- JWT tokens stored in chrome.storage.local
- Automatic token refresh
- Secure API communication over HTTPS
- CSRF protection

### Content Security
- CSP-compliant content scripts
- Input sanitization
- XSS prevention
- Secure iframe handling

### Data Protection
- Encrypted local storage
- Secure API endpoints
- User data isolation
- Privacy-focused data handling

## Performance Considerations

### Memory Management
- Efficient DOM manipulation
- Garbage collection for removed elements
- Memory leak prevention
- Large page handling

### Network Optimization
- Request caching
- Lazy loading
- Background sync
- Offline support

### UI Responsiveness
- Non-blocking operations
- Progressive enhancement
- Smooth animations
- Accessibility compliance

## Error Handling

### User-Facing Errors
- Network connectivity issues
- Authentication failures
- API errors
- Invalid data

### Developer Errors
- Extension update handling
- Browser compatibility
- Permission changes
- Storage quota exceeded

## Testing Strategy

### Unit Tests
- Individual component testing
- API client testing
- Utility function testing

### Integration Tests
- Cross-component communication
- API integration
- Storage operations

### E2E Tests
- Complete user workflows
- Cross-browser testing
- Performance testing

## Deployment Strategy

### Development
- Hot reload during development
- Source maps for debugging
- Development vs production builds

### Production
- Minified and optimized builds
- Chrome Web Store publishing
- Automatic updates
- Version management

### Distribution
- Chrome Web Store
- Enterprise deployment
- Self-hosted options