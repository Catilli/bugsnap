browser.runtime.onInstalled.addListener(() => {
  // BugSnap extension installed
});

// Handle messages from content scripts
browser.runtime.onMessage.addListener((request, sender) => {
  if (request.action === 'fetchProjects') {
    return fetchProjects(request.token);
  }

  if (request.action === 'fetchNextTaskNumber') {
    return fetchNextTaskNumber(request.token, request.projectId);
  }

  if (request.action === 'fetchProjectMembers') {
    return fetchProjectMembers(request.token, request.projectId);
  }

  if (request.action === 'createTask') {
    return createTask(request.token, request.payload);
  }

  if (request.action === 'uploadRecording') {
    return uploadRecording(request.token, request.issueId, request.recordingBase64);
  }

  if (request.action === 'captureScreenshot') {
    return browser.tabs.captureVisibleTab(null, { format: 'png' }).then((dataUrl) => {
      return { screenshot: dataUrl };
    });
  }

  if (request.action === 'setUserEmail') {
    browser.storage.local.set({ userEmail: request.email });
  } else if (request.action === 'clearUserEmail') {
    browser.storage.local.remove('userEmail');
  } else if (request.action === 'setToken') {
    browser.storage.local.set({ token: request.token });
  } else if (request.action === 'clearToken') {
    browser.storage.local.remove('token');
  }

  return Promise.resolve();
});

async function fetchProjects(token) {
  const response = await fetch('http://localhost:3001/api/projects', {
    headers: { 'Authorization': `Bearer ${token}`, 'X-Requested-With': 'BugSnap' }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.status}`);
  }

  const projects = await response.json();
  return { projects };
}

async function fetchNextTaskNumber(token, projectId) {
  const response = await fetch(`http://localhost:3001/api/projects/${projectId}/next-issue-number`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'X-Requested-With': 'BugSnap' }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch next task number: ${response.status}`);
  }

  const data = await response.json();
  return { nextTaskNumber: data.nextTaskNumber };
}

async function fetchProjectMembers(token, projectId) {
  const response = await fetch(`http://localhost:3001/api/projects/${projectId}/members`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'X-Requested-With': 'BugSnap' }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch project members: ${response.status}`);
  }

  const members = await response.json();
  const membersList = members.map(member => ({
    id: member.user.id,
    name: member.user.name,
    email: member.user.email
  }));
  return { members: membersList };
}

async function uploadRecording(token, issueId, base64Data) {
  const byteChars = atob(base64Data);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'video/webm' });

  const formData = new FormData();
  formData.append('file', blob, `recording-${Date.now()}.webm`);

  const response = await fetch(`http://localhost:3001/api/issues/${issueId}/attachments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'BugSnap',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload recording');
  }

  const attachment = await response.json();
  return { attachment };
}

async function createTask(token, payload) {
  const response = await fetch('http://localhost:3001/api/issues', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'BugSnap'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create task');
  }

  const task = await response.json();
  return { task };
}
