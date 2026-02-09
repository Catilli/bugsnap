chrome.runtime.onInstalled.addListener(() => {
  // BugSnap extension installed
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchProjects') {
    fetchProjects(request.token)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'fetchNextTaskNumber') {
    fetchNextTaskNumber(request.token, request.projectId)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'fetchProjectMembers') {
    fetchProjectMembers(request.token, request.projectId)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'createTask') {
    createTask(request.token, request.payload)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep message channel open for async response
  }
});

async function fetchProjects(token) {
  try {
    const response = await fetch('http://localhost:3001/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status}`);
    }

    const projects = await response.json();
    return { projects };
  } catch (error) {
    throw error;
  }
}

async function fetchNextTaskNumber(token, projectId) {
  try {
    const response = await fetch(`http://localhost:3001/api/projects/${projectId}/next-issue-number`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch next task number: ${response.status}`);
    }

    const data = await response.json();
    return { nextTaskNumber: data.nextTaskNumber };
  } catch (error) {
    throw error;
  }
}

async function fetchProjectMembers(token, projectId) {
  try {
    const response = await fetch(`http://localhost:3001/api/projects/${projectId}/members`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch project members: ${response.status}`);
    }

    const members = await response.json();
    // Transform members to include user data
    const membersList = members.map(member => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email
    }));
    return { members: membersList };
  } catch (error) {
    throw error;
  }
}

async function createTask(token, payload) {
  try {
    const response = await fetch('http://localhost:3001/api/issues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create task');
    }

    const task = await response.json();
    return { task };
  } catch (error) {
    throw error;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Capture screenshot
  if (message.action === 'captureScreenshot') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse({ screenshot: dataUrl });
    });
    return true; // Keep channel open for async response
  }

  // Handle auth sync from web app
  if (message.action === 'setUserEmail') {
    chrome.storage.local.set({ userEmail: message.email });
  } else if (message.action === 'clearUserEmail') {
    chrome.storage.local.remove('userEmail');
  } else if (message.action === 'setToken') {
    chrome.storage.local.set({ token: message.token });
  } else if (message.action === 'clearToken') {
    chrome.storage.local.remove('token');
  }
  
  return true;
});