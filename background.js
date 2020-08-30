let paradoxData;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.from === 'content' && msg.subject === 'CORSrequest') {
        runCORSRequest(msg.link);
        sendResponse({success: true});
    }
    if (msg.from === 'content' && msg.subject === 'homeRequest') {
        homeRequest(msg.link);
        sendResponse({success: true});
    }
    if (msg.from === 'popup' && msg.subject === 'openTab') {
        openTab(msg.tab);
        sendResponse({success: true});
    }
    if (msg.subject === 'getParadoxData') {
        sendResponse({data: paradoxData});
    }
    if (msg.msg === 'data_update') {
        paradoxData = msg.data;
        sendResponse({success: true});
    }
    if (msg.from === 'content' && msg.subject === 'initialData') {
        paradoxData = msg.data;
        sendResponse({success: true});
    }
    return true;
});

function runCORSRequest(link) {
    let xhr = new XMLHttpRequest();

    xhr.open('GET', link);

    xhr.send();

    xhr.onload = function () {
        if (xhr.status === 200) {
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                if (tabs[0].id !== undefined) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        from: 'background',
                        subject: 'corsRequest',
                        status: 'success',
                        data: xhr.response
                    });
                }
            });
        }
    };
}

function homeRequest(link) {
    let xhr = new XMLHttpRequest();

    xhr.open('GET', link);

    xhr.send();

    xhr.onload = function () {
        if (xhr.status !== 200) { // HTTP error?
            // handle error
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                if (tabs[0].id !== undefined) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        from: 'background',
                        subject: 'homeRequest',
                        status: 'failed',
                        data: xhr.status
                    }, function (response) {
                        console.log(response)
                    });
                }
            });
            return;
        }

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            if (tabs[0].id !== undefined) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    from: 'background',
                    subject: 'homeRequest',
                    status: 'success',
                    data: xhr.response
                }, function (response) {
                    console.log(response)
                });
            }
        });
    };

    xhr.onerror = function () {
        // handle non-HTTP error (e.g. network down)
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            if (tabs[0].id !== undefined) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    from: 'background',
                    subject: 'homeRequest',
                    status: 'failed',
                    data: xhr.status
                }, function (response) {
                    console.log(response)
                });
            }
        });
    };
}

function openTab(tab) {
    chrome.tabs.create({'url': tab});
}