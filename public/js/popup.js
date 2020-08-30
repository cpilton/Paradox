let result = {ads: {}, adblock: {}, trackers: {}, location: {}, fingerprint: {}, session: {}};
const adsList = ['advert', 'advertisement'];
const adblockList = ['adblock', 'adblk'];
const locationList = ['location'];
const sessionList = ['session'];
const fingerprintList = ['analytic', 'fingerprint', 'browserwidth', 'browserheight', 'screenwidth', 'screenheight', 'wd='];
let violations = 0, violationJustification = [];
let paradoxData;
let host = '';
let href;
$(document).ready(function () {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        href = tabs[0].url;
        $('#version').text('Version: ' + chrome.runtime.getManifest().version);

        if ((href.indexOf('://') !== -1 && href.indexOf('http://') === -1 && href.indexOf('https://') === -1) || href.indexOf('chrome.google.com/webstore') !== -1) {
            $('#loading').remove();
            $('#container').append('<div id="welcome"><div id="load-centre"><span>Welcome to Paradox!</span><div id="welcome-img"></div><span>Load up a webpage to get started</span></div></div>')
        } else {
            // ...query for the active tab...
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, tabs => {
                // ...and send a request for the DOM info...
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {from: 'popup', subject: 'getParadoxObject'},
                    function (response) {
                        if (response !== undefined) {
                            parseReponse(response);
                        } else {
                            chrome.runtime.sendMessage({from: 'popup', subject: 'retry'})
                        }
                    });
            });
        }
    });
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.msg === "data_update") {
            parseReponse(request.data);
            sendResponse({success: true});
        }
        return true;
    }
);

function resetViolations() {
    violations = 0;
    violationJustification = [];
    $('#report-violation').removeClass('with-icon');
    $('#violation-count').css('visibility', 'hidden');
}

let policyTimeout;

function parseReponse(data) {
    if (data !== undefined && (data.url === host || data.type === 'load' || (data.type === 'update' && host === '' && data.url !== undefined))) {
        host = data.url;
        $('#loading').remove();
        paradoxData = data;

        resetViolations();

        if (data.cookies !== undefined) {
            performDataChecks('cookies', data.cookies);
        }

        performDataChecks('storage', data.storage);

        if (data.cors !== undefined) {
            performDataChecks('cors', data.cors);
        }

        analyseResults();

        if (Object.entries(data.policy).length !== 0) {
            analysePolicy(data.policy);
            clearTimeout(policyTimeout);
            let noPolicy = $('#no-policy');
            if (noPolicy.length > 0) {
                noPolicy.remove();
            }
        } else {
            if (data.requests !== undefined && data.requests === 1) {
                policyTimeout = setTimeout(showNoPolicy, 2000);
            } else {
                showNoPolicy();
            }
        }
    }
}


function showNoPolicy() {
    $('#policy').append('<div id="no-policy"><span>No Privacy Policy was found. Check for one before continuing. If you can\'t find a Privacy Policy on this website, consider using the "Report Violation" button.</span></div>');
    updateViolations('no policy');
    $('#policy-loading').remove();
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
    let count = 0;

    $(wordList).each(function () {
        if (dataString.search(this) !== -1) {
            count++;
        }
    });

    return count !== 0;
}

function analyseResults() {
    const types = ['ads', 'adblock', 'location', 'fingerprint', 'session'];

    $(types).each(function () {
        if (result[this].cookies || result[this].cors || result[this].storage) {
            $('#' + this + '-icon').css('background-color', '#FB8C00');
        } else {
            $('#' + this + '-icon').css('background-color', '#43A047');
        }
    });

    if (result.session.cookies || result.session.cors || result.session.storage) {
        $('#session-text').text('Session data is being used to recognise your device');
    } else {
        $('#session-text').text('Session data is not being collected');
    }

    if (result.ads.cookies || result.ads.cors || result.ads.storage) {
        $('#ads-text').text('Websites you visit are being logged to personalise your ads');
    } else {
        $('#ads-text').text('The websites you visit are not being logged for advertising');
    }

    if (result.adblock.cookies || result.adblock.cors || result.adblock.storage) {
        $('#adblock-text').text('Ad-block detection may be used to show you ads');
    } else {
        $('#adblock-text').text('Ad-block detection is not in use');
    }

    if (result.location.cookies || result.location.cors || result.location.storage) {
        $('#location-text').text('Your location is being tracked');
    } else {
        $('#location-text').text('Your location is not being tracked');
    }

    if (result.fingerprint.cookies || result.fingerprint.cors || result.fingerprint.storage) {
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

        if (result.location.cookies || result.location.cors || result.location.storage) {
            const justification = 'location tracking despite claiming no personal information will be collected';
            if (!violationJustification.includes(justification)) {
                updateViolations(justification);
            }
        }
        if (result.fingerprint.cookies || result.fingerprint.cors || result.fingerprint.storage) {
            const justification = 'fingerprint tracking despite claiming no personal information will be collected';
            if (!violationJustification.includes(justification)) {
                updateViolations(justification);
            }
        }
    }

    if (!paradoxPolicy.informationRequest.match || !paradoxPolicy.rejectDataCollection.match || paradoxPolicy.rejectDataCollectionConsequence.match) {
        if (!paradoxPolicy.informationRequest.match) {
            $('#your-choices-text').text('The policy does not say you can request your information');

            const justification = 'no method for data request provided';
            if (!violationJustification.includes(justification)) {
                updateViolations(justification);
            }

        } else if (!paradoxPolicy.rejectDataCollection.match) {
            $('#your-choices-text').text('You cannot reject data collection if you want to use this website');

            const justification = 'no option to reject data collection provided';
            if (!violationJustification.includes(justification)) {
                updateViolations(justification);
            }

        } else if (paradoxPolicy.rejectDataCollectionConsequence.match) {
            $('#your-choices-text').text('There are consequences to rejecting data collection');
        }
        $('#your-choices-icon').addClass('warning');
    } else {
        $('#your-choices-text').text('You can request your data, and opt out of data collection');
        $('#your-choices-icon').addClass('tick');
    }

    if (paradoxPolicy.thirdPartySharing.match || paradoxPolicy.recommendations.match || !paradoxPolicy.dataSecurity.match) {
        if (!paradoxPolicy.dataSecurity.match) {
            $('#data-usage-text').text('Your personal data may not be stored securely');

            const justification = 'personal data security not mentioned';
            if (!violationJustification.includes(justification)) {
                updateViolations(justification);
            }

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
        $('#tracking-text').text('This website doesn\'t track your usage, or personalise ads');

        if (paradoxData.cookies.length > 0) {
            const justification = 'cookies used but not declared in privacy policy';
            if (!violationJustification.includes(justification)) {
                updateViolations(justification);
            }
        }
        if (result.ads.cookies || result.ads.cors || result.ads.storage) {
            const justification = 'analytics used but not declared in privacy policy';
            if (!violationJustification.includes(justification)) {
                updateViolations(justification);
            }
        }

        $('#tracking-icon').addClass('tick');
    }
    $('#policy-loading').remove();
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('report-violation').addEventListener('click', function () {
        reportViolation();
    });
    document.getElementById('full-report').addEventListener('click', function () {
        fullReport();
    });
});

function reportViolation() {
    chrome.runtime.sendMessage({from: 'popup', subject: 'openTab', tab: 'public/violation.html'});
}

function fullReport() {
    chrome.tabs.create({'url': 'public/report.html'});
}

function updateViolations(justification) {
    violations++;
    violationJustification.push(justification);

    $('#report-violation').addClass('with-icon');
    let violationCount = $('#violation-count');
    violationCount.css('visibility', 'visible');
    violationCount.text(violations.toString());
}