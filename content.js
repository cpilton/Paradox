var cors = [];
let cookies;
let storage;
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

getData();

function getData() {
    cookies = getCookies();
    storage = getLocalStorage();

    updatePopup();

}

window.addEventListener("message", function (message) {
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

    updatePopup();
}

//Send updates to popup
function updatePopup() {
    chrome.runtime.sendMessage({
        msg: "data_update",
        data: {
            cookies: cookies,
            storage: storage,
            cors: cors
        }
    });
}

getPolicy(findPrivacyPolicy())

var result = {};
const searchList = {
    cookies: ['use cookies', 'unique identifiers'],
    directDataCollection: ['information you give us', 'information you provide'],
    automaticDataCollecion: ['automatically receive and store certain types of information'],
    externalDataCollection: ['information about you from other sources']
};

//Format the policy
function parsePolicy(policy) {
    //Regex for scripts, images, comments, and blank lines
    var regex = [/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, /(<!--.*?-->)|(<!--[\S\s]+?-->)|(<!--[\S\s]*?$)/g, /^\s*$(?:\r\n?|\n)/gm];

    //Remove unwanted text
    $(regex).each(function () {
        while (this.test(policy)) {
            policy = policy.replace(this, "");
        }
    });

    //Convert to lowercase for comparison
    policy = policy.toLowerCase();

    var searchTerms = [];

    //Loop through searchList keys to create key-set
    for (var key in searchList) {
        if (searchList.hasOwnProperty(key)) {
            searchTerms.push(key);
        }
    }

    //Loop through key-set, run checkForMatch function on each
    $(searchTerms).each(function () {
        result[this] = checkForMatch(policy, searchList[this]);
    });

    console.log(result);
}

//Find a link to the privacy policy on the website
function findPrivacyPolicy() {
    return $('a[href*="privacy"]').attr('href');
}

//Get the policy as a string
function getPolicy(link) {
    if (link !== undefined) {

        var privacyPolicy;

        //get the privacy policy using a JQuery GET request
        $.get(link, function (data) {
            privacyPolicy = data;
        })
            .done(function () {
                parsePolicy(privacyPolicy);
            })
            .fail(function () {
                console.log('Paradox failed to get the Privacy Policy for this Website');
            });
    } else {
        console.log('Paradox failed to find a Privacy Policy for this Website.');
    }
}

//Check the privacy policy for pre-defined strings
function checkForMatch(dataString, wordList) {
    var count = 0;
    var matches = [];

    //Check the policy for a string, and if found increase counter and push string to matches
    $(wordList).each(function () {
        if (dataString.search(this) != -1) {
            matches.push(this);
            count++;
        }
    });

    if (count == 0) {
        return {match: false};
    } else {
        return {match: true, data: matches};
    }
}
