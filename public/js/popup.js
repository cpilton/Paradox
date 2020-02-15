var result = {ads:{},adblock:{},trackers:{},location:{},fingerprint:{},session:{}};
const adsList = ['advert','advertisement','session'];
const adblockList = ['adblock','adblk'];
const locationList = ['location'];
const sessionList = ['session'];
const fingerprintList = ['fingerprint','browserwidth','browserheight','screenwidth','screenheight','wd=','user'];

window.addEventListener('DOMContentLoaded', () => {
    // ...query for the active tab...
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => {
        // ...and send a request for the DOM info...
        chrome.tabs.sendMessage(
            tabs[0].id,
            {from: 'popup', subject: 'DOMInfo'},
             function updatePopup(response) {
                 parseReponse(response)
             });
    });
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.msg === "data_update") {
            parseReponse(request.data);
        }
    }
);

function parseReponse(data) {
    if (data !== undefined) {
        if (data.cookies !== undefined) {
            document.getElementById('tracking-cookies-value').textContent = data.cookies.length;
            performDataChecks('cookies',data.cookies);
        } else {
            document.getElementById('tracking-cookies-value').textContent = "0";
        }

        if (Number.isInteger(data.storage.length)) {
            document.getElementById('local-storage-value').textContent = data.storage.length;
            performDataChecks('storage',data.storage);
        } else {
            document.getElementById('local-storage-value').textContent = Object.keys(data.storage).length;
            performDataChecks('storage',data.storage);

        }

        if (data.cors !== undefined) {
            document.getElementById('cors-value').textContent = data.cors.length;
            performDataChecks('cors',data.cors);
        } else {
            document.getElementById('cors-value').textContent = "0";
        }
        analyseResults();
    } else {
        document.getElementById('local-storage-value').textContent = "0";
        document.getElementById('tracking-cookies-value').textContent = "0";
        document.getElementById('cors-value').textContent = "0";
    }

    console.log(data);
}

function performDataChecks(type, data) {
    result.ads[type] = checkForMatch(data, adsList);
    result.adblock[type] = checkForMatch(data, adblockList);
    result.location[type] = checkForMatch(data, locationList);
    result.fingerprint[type] = checkForMatch(data, fingerprintList);
    result.session[type] = checkForMatch(data, sessionList);
}

function checkForMatch(data, wordList) {
    const dataString = data.toString();
    var count = 0;

    $(wordList).each(function() {
        if (dataString.search(this) != -1) {
            count++;
        }
    });

    if (count == 0) {
        return false;
    } else {
        return true;
    }
}

function analyseResults() {
    var types = ['ads','adblock','location','fingerprint','session'];

    $(types).each(function() {
        if (result[this].cookies == true || result[this].cors == true|| result[this].storage == true) {
            $('#'+this+'-icon .result').css('background-color','#e53935');
        } else {
            $('#'+this+'-icon .result').css('background-color','#43A047');
        }
    });
}

