let tabs = {};
chrome = this.browser || this.chrome;
const inspectFile = 'inspect.js';
const activeIcon = 'active-64.png';
const defaultIcon = 'default-64.png';

const inspect = {
  toggleActivate: function(id, type, icon) {
    this.id = id;
    chrome.tabs.executeScript(id, {file: inspectFile}, function() {
      chrome.tabs.sendMessage(id, {action: type});
    }.bind(this));

    chrome.browserAction.setIcon({tabId: id, path: {19: 'icons/' + icon}});
  }
};

function toggle(tab) {
  if (isSupportedProtocol(tab.url)) {
    if (!tabs[tab.id]) {
      tabs[tab.id] = Object.create(inspect);
      inspect.toggleActivate(tab.id, 'activate', activeIcon);
    } else {
      inspect.toggleActivate(tab.id, 'deactivate', defaultIcon);
      for (let tabId in tabs) {
        if (tabId == tab.id) delete tabs[tabId];
      }
    }
  }
}

function deactivateItem(tab) {
  if (tab[0]) {
    if (isSupportedProtocol(tab[0].url)) {
      for (let tabId in tabs) {
        if (tabId == tab[0].id) {
          delete tabs[tabId];
          inspect.toggleActivate(tab[0].id, 'deactivate', defaultIcon);
        }
      }
    }
  }
}

function getActiveTab() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    deactivateItem(tabs);
  });
}

function isSupportedProtocol(urlString) {
  const supportedProtocols = ['https:', 'http:', 'file:'];
  const url = document.createElement('a');
  url.href = urlString;
  return supportedProtocols.indexOf(url.protocol) != -1;
}

chrome.commands.onCommand.addListener(command => {
  if (command === 'toggle-xpath') {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      toggle(tabs[0]);
    });
  }
});

chrome.extension.onConnect.addListener(function(port) {
  console.assert(port.name == 'screenshot');
  port.onMessage.addListener(function(msg) {
    if (msg.request == 'screenshot') {
      chrome.tabs.captureVisibleTab(
          null, {format: 'jpeg', quality: 100}, function(img) {
            // post message only after call back return with Data URL
            port.postMessage(img);
          });
    }
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log(request);
  if (request.contentScriptQuery == 'sendAnnotations') {
    var url = 'http://localhost:8000';
    fetch(url, {method: 'post', body: request.body}).then(function(response) {
      return response.text();
    });

    return true;
  }
});


chrome.tabs.onUpdated.addListener(getActiveTab);
chrome.browserAction.onClicked.addListener(toggle);