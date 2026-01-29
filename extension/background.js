chrome.runtime.onInstalled.addListener(() => {
  console.log('BugSnap extension installed');
});

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