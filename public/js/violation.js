let result = {ads: {}, adblock: {}, trackers: {}, location: {}, fingerprint: {}, session: {}};
const adsList = ['advert', 'advertisement'];
const adblockList = ['adblock', 'adblk'];
const locationList = ['location'];
const sessionList = ['session'];
const fingerprintList = ['analytic', 'fingerprint', 'browserwidth', 'browserheight', 'screenwidth', 'screenheight', 'wd='];
let violations = 0, violationJustification = [];

let host;
$(document).ready(function () {
    $('#version').text('Version: ' + chrome.runtime.getManifest().version);
    chrome.runtime.sendMessage({from: 'violation', subject: 'getParadoxData'},
        function (response) {
            parseReponse(response.data);
            $('#url').text(response.data.url);
            $('#report-date').text(new Date().toLocaleString());
            host = response.data.url;
        }
    );
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.msg === "data_update" && request.data.url === host) {
            parseReponse(request.data);
            sendResponse({success: true});
        }
        return true;
    }
);

host = '';

function resetViolations() {
    $('#violations .tracker').remove();
    violations = 0;
    violationJustification = [];
    $('#violations').append('<div class="tracker" id="no-violations"><div class="result-icon tick"></div><div class="result-text">No violations detected</div></div>');
}

function parseReponse(data) {
    if (data !== undefined) {
        resetViolations();
        paradoxData = data;

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
            let noPolicy = $('#no-policy');
            if (noPolicy.length > 0) {
                noPolicy.remove();
            }
        } else {
            if ($('#no-policy').length === 0) {
                $('#policy').append('<div id="no-policy"><span>No Privacy Policy was found. Check for one before continuing.</span></div>');
            }
            updateViolations('no privacy policy');
        }
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

    console.log(result);

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

    if (paradoxPolicy.email !== null && paradoxPolicy.email.length !== 0) {
        let noEmail = $('#no-email');
        if (noEmail.length !== 0) {
            noEmail.remove();
        }
        paradoxPolicy.email = paradoxPolicy.email.filter(onlyUnique);
        $(paradoxPolicy.email).each(function () {
            const shortEmail = this.split('@');
            $('#email #' + shortEmail[0]).remove();
            $('#email').append('<div class="tracker" id="' + shortEmail[0] + '"><div class="result-icon email"></div><div class="result-text">' + this + '</div></div> ')
        })
    }
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function updateViolations(justification) {
    violations++;
    violationJustification.push(justification);
    let noViolations = $('#no-violations');
    if (noViolations.length !== 0) {
        noViolations.remove();
    }
    const shortJustification = justification.replace(/ /g, '');
    $('#violations #' + shortJustification).remove();
    $('#violations').append('<div class="tracker" id="' + shortJustification + '"><div class="result-icon warning"></div><div class="result-text">' + justification.replace(/^\w/, c => c.toUpperCase()) + '</div></div> ')
}

$(document).ready(function () {
    $('#send-email').click(function () {
        const address = $('#email-address').val();
        const body = $('#email-creator').val();
        const subject = 'Potential Privacy Violation';
        window.open("mailto:" + address + "?subject=" + subject + "&body=" + body);
    });
});
