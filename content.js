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
    automaticDataCollection: ['automatically receive and store certain types of information'],
    externalDataCollection: ['information about you from other sources'],
    usabilityTracking: ['provide functionality','analyse performance','fix errors','improve usability'],
    recommendations: ['recommend features','recommend products', 'recommend services', 'personalise your experience'],
    voiceTracking: ['process your voice'],
    communication: ['communicate with you'],
    advertising: ['advertising',' interest-based ads',' interest-based advertisements'],
    uncategorisedData: ['process your personal information for a specific purpose'],
    thirdPartySharing: ['share the information','shared with third parties','provided by third parties', 'third party is involved in your transactions','share customer information related to those transactions with that third party','other companies','other individuals','other companies and individuals','third-party service providers have access to personal information'],
    businessSharing: ['we might sell or buy'],
    dataRelease: ['we release account','we release personal','exchanging information'],
    dataSecurity: ['ssl','protect the security','pci dss','security procedures','security features'],
    thirdPartyAdvertising: ['third-party advertising','third party advertising partners'],
    informationRequest: ['can access your information','access your personal','information request','right to request access'],
    rejectDataCollection: ['you can choose not to provide','withdraw your consent','able to opt out','object to our processing of your personal data'],
    rejectDataCollectionConsequence: ['not be able to take advantage','not be able to add items to your shopping basket'],
    dataCollection: ['keep a copy of the previous version','our records'],
    dataRetention: ['keep your personal','as long as it is required'],
    dataTypes: ['search results','contacts','images','videos','files','name','address','phone number','payment information','age','location','friends','other people','voice recordings','documents','financial information','credit history','vat number','device log file','wi-fi credentials','internet protocol','ip address','password','device metrics','connectivity data','searched for','browsing','interactions with products','internet-connected devices'],
    analytics: ['page response times','download errors','length of visit','page interaction','scrolling','clicks','mouse-overs']

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

    //Find email addresses in privacy policy
    var email = policy.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);

    console.log(email);
    console.log(result);
}

//Find a link to the privacy policy on the website
function findPrivacyPolicy() {
    return $('a[href*="privacy"]').attr('href');
}

//Get the policy as a string
function getPolicy(link) {
    if (link !== undefined) {
        console.log('Paradox is loading the Privacy Policy from: ' + link);
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
