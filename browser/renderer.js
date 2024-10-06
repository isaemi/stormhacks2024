const webview = document.getElementById('webview');
const backButton = document.getElementById('back');
const forwardButton = document.getElementById('forward');
const refreshButton = document.getElementById('refresh');
const homeButton = document.getElementById('home');
const urlInput = document.getElementById('url');
const loadingStreak = document.getElementById('loading-streak');

// Show the loading streak when navigation starts
webview.addEventListener('did-start-loading', () => {
  loadingStreak.style.display = 'block';
});

// Hide the loading streak when navigation finishes
webview.addEventListener('did-stop-loading', () => {
  loadingStreak.style.display = 'none';
});


// Go back in the webview's history
backButton.addEventListener('click', () => {
  if (webview.canGoBack()) {
    webview.goBack();
  }
});

// Go forward in the webview's history
forwardButton.addEventListener('click', () => {
  if (webview.canGoForward()) {
    webview.goForward();
  }
});

// Refresh the current page
refreshButton.addEventListener('click', () => {
  webview.reload();
});

// Go to home page
homeButton.addEventListener('click', () => {
  webview.src = 'http://209.87.57.134:3000';
  urlInput.value = webview.src;
});

// Navigate to the entered URL
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    let url = urlInput.value.trim();
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    webview.src = url;
  }
});

// Update URL input when the page changes
webview.addEventListener('did-navigate', () => {
  urlInput.value = webview.getURL();
});


webview.addEventListener('did-fail-load', (event) => {
    // Check if the load failed due to a bad URL
    if (event.errorCode !== -3) {  // -3 means 'aborted', which is not an error
      const failedUrl = urlInput.value;
      
      // Redirect to Google search
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(failedUrl)}`;
      webview.src = searchUrl;
      urlInput.value = searchUrl;
    }
  });