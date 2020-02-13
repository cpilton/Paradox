const cookies = getCookies();
const storage = getLocalStorage();
const cors = [];
const s = document.createElement('script');

//Run on extension click
chrome.runtime.sendMessage({
    from: 'content',
    subject: 'showPageAction',
});

//Read Chrome Messages
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.message === "clicked_browser_action") {
            var firstHref = $("a[href^='http']").eq(0).attr("href");
            console.log(firstHref);
        }
        if ((request.from === 'popup') && (request.subject === 'DOMInfo')) {
            var domInfo = {
                cookies: cookies,
                storage: storage,
                cors: cors,
            };

            sendResponse(domInfo);
        }
    }
);

window.addEventListener("message", function(message) {
    if (message.data.from == 'paradox' && message.data.type == 'paradoxCORSEvent') {
        readCORS(event.data);
    }
});

//Inject paradox.js
s.src = chrome.extension.getURL('paradox.js');
s.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

//Get cookies from host
function getCookies() {
    if (document.cookie.split(';').length > 0) {
        return document.cookie.split(';');
    } else {
        return [];
    }

}

//Get local storage from host
function getLocalStorage() {
    if (localStorage.length > 0) {
        return localStorage;
    } else {
        return [];
    }
}

//Analyse CORS
function readCORS(CORS) {

    var data;
    if (CORS.format == 'string') {
        data = CORS.data;
    } else if (CORS.format == 'json') {
        data = CORS.requestModel + CORS.responseModel;
    }

    cors.push(data);

    var adsFilter = ['ad', 'ads', 'adverts', 'advert', 'advertising'];

    var count = {};

    if (count['ads'] == undefined) {
        count['ads'] = 0;
    }
    $(adsFilter).each(function() {
        var re = new RegExp(this, 'g');
        //count['ads'] = count['ads'] + data.match(re).length;
    });

    //console.log('Number of Ad trackers: ' + count['ads']);
}

readPrivacyPolicy();
var policyWait
function readPrivacyPolicy() {
    if(createPolicyJFrame(findPrivacyPolicy())) {
        policyWait = setInterval(waitForPolicy, 50);
    }
}

function waitForPolicy() {
    try {
        var policyBody = document.getElementById('paradox-policy').import.querySelector('body');
    } catch (exception) {
        //Policy hasn't loaded yet.
    }

    if (policyBody !== null) {
        clearInterval(policyWait);
        parsePolicy(policyBody);
    }
}

function parsePolicy(policy) {
    console.log(policy);
}

function findPrivacyPolicy() {
    return $('a[href*="privacy"]').attr('href');
}

function createPolicyJFrame(link) {

    if (link.length > 0) {
        $("#paradox-policy").load(link);

        return true;
    } else {
        return false;
    }
}
