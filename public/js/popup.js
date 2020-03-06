var result = {ads: {}, adblock: {}, trackers: {}, location: {}, fingerprint: {}, session: {}};
const adsList = ['advert', 'advertisement', 'session'];
const adblockList = ['adblock', 'adblk'];
const locationList = ['location'];
const sessionList = ['session'];
const fingerprintList = ['fingerprint', 'browserwidth', 'browserheight', 'screenwidth', 'screenheight', 'wd=', 'user'];

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
    function (request, sender, sendResponse) {
        if (request.msg === "data_update") {
            parseReponse(request.data);
        }
    }
);

var host = '';

function parseReponse(data) {
    if (data !== undefined && (data.url == host || data.type == 'load')) {
        host = data.url;

        if (data.cookies !== undefined) {
            performDataChecks('cookies', data.cookies);
        }

        performDataChecks('storage', data.storage);

        if (data.cors !== undefined) {
            performDataChecks('cors', data.cors);
        }
        analyseResults();
        analysePolicy(data.policy);
    }
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

    $(wordList).each(function () {
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
    var types = ['ads', 'adblock', 'location', 'fingerprint', 'session'];

    $(types).each(function () {
        if (result[this].cookies == true || result[this].cors == true || result[this].storage == true) {
            $('#' + this + '-icon').css('background-color', '#FB8C00');
        } else {
            $('#' + this + '-icon').css('background-color', '#43A047');
        }
    });

    if (result.session.cookies == true || result.session.cors == true || result.session.storage == true) {
        $('#session-text').text('Session data is being used to recognise your device');
    } else {
        $('#session-text').text('Session data is not being collected');
    }

    if (result.ads.cookies == true || result.ads.cors == true || result.ads.storage == true) {
        $('#ads-text').text('Websites you visit are being logged to personalise your ads');
    } else {
        $('#ads-text').text('The website you visit are not being logged for advertising');
    }

    if (result.adblock.cookies == true || result.adblock.cors == true || result.adblock.storage == true) {
        $('#adblock-text').text('Ad-block detection may be used to show you ads');
    } else {
        $('#adblock-text').text('Ad-block detection is not in use');
    }

    if (result.location.cookies == true || result.location.cors == true || result.location.storage == true) {
        $('#location-text').text('Your location is being tracked');
    } else {
        $('#location-text').text('Your location is not being tracked');
    }

    if (result.fingerprint.cookies == true || result.fingerprint.cors == true || result.fingerprint.storage == true) {
        $('#fingerprint-text').text('Fingerprinting is being used to recognise your device');
    } else {
        $('#fingerprint-text').text('Fingerprinting is not being used');
    }
}

function analysePolicy(paradoxPolicy) {
    if (paradoxPolicy.dataTypes.match) {
        $('#data-collection-text').text('Your personal information may be collected');
        $('#data-collection-icon').addClass('warning');
    } else {
        $('#data-collection-text').text('Your personal information will not be collected');
        $('#data-collection-icon').addClass('tick');
    }

    if (!paradoxPolicy.informationRequest.match || !paradoxPolicy.rejectDataCollection.match || paradoxPolicy.rejectDataCollectionConsequence.match) {
        if (!paradoxPolicy.informationRequest.match) {
            $('#your-choices-text').text('The policy does not say you can request your information');
        } else if (!paradoxPolicy.rejectDataCollection.match) {
            $('#your-choices-text').text('You cannot reject data collection if you want to use this website');
        } else if (paradoxPolicy.rejectDataCollectionConsequence.match) {
            $('#your-choices-text').text('There are consequences to rejecting data collection');
        }
        $('#your-choices-icon').addClass('warning');
    } else {
        $('#your-choices-text').text('You can request your data, and opt out of data collection');
        $('#your-choices-icon').addClass('tick');
    }

    if (paradoxPolicy.thirdPartySharing.match || paradoxPolicy.recommendations.match || paradoxPolicy.dataSecurity.match) {
        if (paradoxPolicy.dataSecurity.match) {
            $('#data-usage-text').text('Your personal data may not be stored securely');
        } else if (paradoxPolicy.thirdPartySharing.match) {
            $('#data-usage-text').text('Your data may be shared or sold to third-parties');
        } else if (paradoxPolicy.recommendations.match) {
            $('#data-usage-text').text('You data may be used to recommend products/services');
        }
        $('#data-usage-icon').addClass('warning');
    } else {
        $('#data-usage-text').text('Your data will be kept secure, and won\'t be shared or sold');
        $('#data-usage-icon').addClass('tick');
    }

    if (paradoxPolicy.advertising.match || paradoxPolicy.cookies.match || paradoxPolicy.analytics.match || paradoxPolicy.usabilityTracking.match) {
        if (paradoxPolicy.advertising.match) {
            $('#tracking-text').text('Your personal data may be used to show you personalised ads');
        } else if (paradoxPolicy.analytics.match) {
            $('#tracking-text').text('This website tracks how you use it');
        } else if (paradoxPolicy.cookies.match) {
            $('#tracking-text').text('This website uses cookies');
        } else if (paradoxPolicy.usabilityTracking.match) {
            $('#tracking-text').text('Your usage of this website may be monitored');
        }
        $('#tracking-icon').addClass('warning');
    } else {
        $('#tracking-text').text('This website does track your usage, or personalise ads');
        $('#tracking-icon').addClass('tick');
    }
}

$('#full-report').click(function() {

});

$('#report-violation').click(function() {

});

