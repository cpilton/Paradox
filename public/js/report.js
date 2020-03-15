var result = {ads: {}, adblock: {}, trackers: {}, location: {}, fingerprint: {}, session: {}};
const adsList = ['advert', 'advertisement','ads'];
const adblockList = ['adblock', 'adblk'];
const locationList = ['location'];
const sessionList = ['session'];
const fingerprintList = ['analytic', 'fingerprint', 'browserwidth', 'browserheight', 'screenwidth', 'screenheight', 'wd=', 'user'];
var violations = 0, violationJustification = [];

$(document).ready(function () {
    $('#version').text('Version: ' + chrome.runtime.getManifest().version);

    chrome.runtime.sendMessage({from: 'violation', subject: 'getParadoxData'},
        function (response) {
            parseReponse(response.data);
            $('#url').text(response.data.url);
            $('#report-date').text(new Date().toLocaleString());
        }
    );
});


function parseReponse(data) {
    if (data !== undefined) {
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
        } else {
            $('#policy').append('<div id="no-policy"><span>No Privacy Policy was found. Check for one before continuing. If you can\'t find a Privacy Policy on this website, consider using the "Report Violation" button.</span></div>');
            updateViolations('no privacy policy');
        }
        trackerTypes(data);
        paradoxData = data;
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
    var matches = [];

    $(wordList).each(function () {
        if (dataString.search(this) != -1) {
            count++;
            matches.push(this);
        }
    });

    if (count == 0) {
        return {value: false};
    } else {
        return {value: true, matches: matches}
    }
}

function analyseResults() {
    var types = ['ads', 'adblock', 'location', 'fingerprint', 'session'];

    $(types).each(function () {
        if (result[this].cookies.value || result[this].cors.value || result[this].storage.value) {
            $('#' + this + '-icon').css('background-color', '#FB8C00');
        } else {
            $('#' + this + '-icon').css('background-color', '#43A047');
        }
    });

    if (result.session.cookies.value || result.session.cors.value || result.session.storage.value) {
        $('#session-text').text('Session data is being used to recognise your device');
    } else {
        $('#session-text').text('Session data is not being collected');
    }

    if (result.ads.cookies.value || result.ads.cors.value || result.ads.storage.value) {
        $('#ads-text').text('Websites you visit are being logged to personalise your ads');
    } else {
        $('#ads-text').text('The websites you visit are not being logged for advertising');
    }

    if (result.adblock.cookies.value || result.adblock.cors.value || result.adblock.storage.value) {
        $('#adblock-text').text('Ad-block detection may be used to show you ads');
    } else {
        $('#adblock-text').text('Ad-block detection is not in use');
    }

    if (result.location.cookies.value || result.location.cors.value || result.location.storage.value) {
        $('#location-text').text('Your location is being tracked');
    } else {
        $('#location-text').text('Your location is not being tracked');
    }

    if (result.fingerprint.cookies.value || result.fingerprint.cors.value || result.fingerprint.storage.value) {
        $('#fingerprint-text').text('Fingerprinting is being used to recognise your device');
    } else {
        $('#fingerprint-text').text('Fingerprinting is not being used');
    }

    fullTrackerAnalysis();
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

        if (result.session.cookies || result.session.cors || result.session.storage) {
            const justification = 'cookies used but not declared in privacy policy';
            if (!violationJustification.includes(justification)) {
                updateViolations(justification);
            }
        }
        if (result.fingerprint.cookies || result.fingerprint.cors || result.fingerprint.storage) {
            const justification = 'analytics used but not declared in privacy policy';
            if (!violationJustification.includes(justification)) {
                updateViolations(justification);
            }
        }

        $('#tracking-icon').addClass('tick');
    }

    if (paradoxPolicy.email !== null && paradoxPolicy.email.length !== 0) {
        if ($('#no-email').length !== 0) {
            $('#no-email').remove();
        }
        paradoxPolicy.email = paradoxPolicy.email.filter(onlyUnique);
        $(paradoxPolicy.email).each(function () {
            $('#email').append('<div class="tracker"><div class="result-icon email"></div><div class="result-text">' + this + '</div></div> ')
        })
    }
    fullPolicyAnalysis(paradoxPolicy);
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function updateViolations(justification) {
    violations++;
    violationJustification.push(justification);
    if ($('#no-violations').length !== 0) {
        $('#no-violations').remove();
    }
    $('#violations').append('<div class="tracker"><div class="result-icon warning"></div><div class="result-text">' + justification.replace(/^\w/, c => c.toUpperCase()) + '</div></div> ')
}

function fullTrackerAnalysis() {
    var types = ['ads', 'adblock', 'location', 'fingerprint', 'session'];
    var storageTypes = ['cookies','cors','storage'];
    $(types).each(function () {
        if (result[this].cookies.value || result[this].cors.value || result[this].storage.value) {
            var type = this;
            $(result[type]).each(function () {
                var resultType = this;
                $(storageTypes).each(function() {
                    var storageType = this;
                    $(resultType[storageType]).each(function () {
                        if (this.value) {
                            $(this.matches).each(function () {
                                var div = '<div class="tracker">';
                                div += '<div class="result-icon warning"></div>';
                                div += '<div class="result-text">The following was detected in ' + storageType + ': ' + this + '</div>';
                                div += '</div>';

                                $('#no-' + type).remove();
                                $('#' + type + '-full').append(div);
                            });
                        }
                    });
                });
            });
        }
    });
}

function fullPolicyAnalysis(policy) {
    for (var key in policy) {
        var type = key.toLowerCase();
        if (policy[key].match) {
            var responseType;
            if($('#'+ type + ' .result-icon').hasClass('tick')) {
                responseType = 'warning';
            } else {
                responseType = 'tick';
            }
            $('#no-' + type).remove();

            $(policy[key].data).each(function() {
                var div = '<div class="tracker">';
                div += '<div class="result-icon ' + responseType + '"></div>';
                div += '<div class="result-text">The following was detected: ' + this + '</div>';
                div += '</div>';

                $('#' + type).append(div);
            });
        }
    }
}
function trackerTypes(data) {
    var storageTypes = ['cookies','cors','storage'];
    $(storageTypes).each(function() {
        var length, responseType, text;

        if (data[this].length !== undefined) {
            length = data[this].length;
        } else {
            length = Object.keys(data[this]).length;
        }

        if(length > 0) {
            responseType = 'warning';
        } else {
            responseType = 'tick';
        }

        if (this == 'cookies') {
            text = 'cookie';
        } else if (this == 'cors') {
            text = 'GET/POST';
        } else if (this == 'storage') {
            text = 'local storage'
        }

        var div = '<div class="tracker">';
        div += '<div class="result-icon ' + responseType + '"></div>';
        div += '<div class="result-text">The number of ' + text + ' trackers detected was: ' + length + '</div>';
        div += '</div>';

        $('#' + this + '-tracker').append(div);
    });
}