/**
 chrome.browserAction.onClicked.addListener(function(tab) {
    // Send a message to the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
    });
});
 */

chrome.runtime.onMessage.addListener((msg, sender) => {
    if ((msg.from === 'content') && (msg.subject === 'showPageAction')) {
        chrome.pageAction.show(sender.tab.id);
    }
    if (msg.from === 'content' && msg.subject === 'CORSrequest') {
        runCORSRequest(msg.link);
    }
});

function runCORSRequest(link) {
    let xhr = new XMLHttpRequest();

    xhr.open('GET', link);

    xhr.send();

    xhr.onload = function() {
        if (xhr.status != 200) { // HTTP error?
            // handle error
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    from: 'background',
                    subject: 'corsRequest',
                    status: 'failed',
                    data: xhr.status
                }, function (response) {
                });
            });
            return;
        }

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                from: 'background',
                subject: 'corsRequest',
                status: 'success',
                data: xhr.response
            }, function (response) {
            });
        });
    };

    xhr.onerror = function() {
        // handle non-HTTP error (e.g. network down)
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                from: 'background',
                subject: 'corsRequest',
                status: 'failed',
                data: xhr.status
            }, function (response) {
            });
        });
    };
}
