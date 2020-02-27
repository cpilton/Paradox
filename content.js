var cors = [];
let cookies;
let storage;
let policyResult = {};
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
                policy: policyResult
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
        readCORS(message.data);
    }
    if (message.data.from == 'paradox' && message.data.type == 'policyRequest') {
        window.postMessage({
            from: 'content',
            type: 'paradoxPolicy',
            policy: policyResult,
            icon: chrome.extension.getURL("/public/img/logo.png")
        }, "*");
    }
});

function injectScript() {
//Inject paradox.js
    s.src = chrome.extension.getURL('paradox.js');
    s.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}

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
            cors: cors,
            policy: policyResult
        }
    });
}

getPolicy(findPrivacyPolicy())

const searchList = {
    cookies: ['use cookies', 'unique identifiers', 'cookies stored on your device'],
    directDataCollection: ['face recognition technology', 'information you give us', 'information you provide', 'content you provide'],
    externalDataCollection: ['partners provide information about your activities', 'advertisers, app developers and publishers can send us information', 'information about you from other sources', 'information that other people provide'],
    usabilityTracking: ['improve our products', 'provide functionality', 'analyse performance', 'fix errors', 'improve usability'],
    recommendations: ['give you tips', 'recommend features', 'recommend products', 'recommend services', 'personalise your experience', 'make suggestions for you'],
    advertising: ['personalise ads', 'sponsored content', 'we choose the ads that you see', 'third-party advertising', 'third party advertising partners', 'advertising', ' interest-based ads', ' interest-based advertisements'],
    thirdPartySharing: ['we share information about you', 'sharing with third-party partners', 'we might sell or buy', 'share the information', 'shared with third parties', 'provided by third parties', 'third party is involved in your transactions', 'share customer information related to those transactions with that third party', 'other companies', 'other individuals', 'other companies and individuals', 'third-party service providers have access to personal information'],
    dataRelease: ['we release account', 'we release personal', 'exchanging information'],
    dataSecurity: ['ssl', 'protect the security', 'pci dss', 'security procedures', 'security features'],
    informationRequest: ['you have the right to access', 'can access your information', 'access your personal', 'information request', 'right to request access'],
    rejectDataCollection: ['right to object', 'you can choose not to provide', 'withdraw your consent', 'able to opt out', 'object to our processing of your personal data'],
    rejectDataCollectionConsequence: ['not be able to take advantage', 'not be able to add items to your shopping basket'],
    dataRetention: ['we store data until it is no longer necessary', 'until your account is deleted', 'keep a copy of the previous version', 'keep your personal', 'as long as it is required'],
    dataTypes: ['search results', 'address book', 'call log', 'sms log', 'contacts', 'images', 'videos', 'files', 'name', 'address', 'phone number', 'payment information', 'age', 'location', 'friends', 'religious views', 'political views', 'your health', 'ethnic origin', 'philosophical beliefs', 'people', 'voice recordings', 'documents', 'financial information', 'credit history', 'vat number', 'device log file', 'wi-fi credentials', 'internet protocol', 'ip address', 'password', 'device metrics', 'connectivity data', 'searched for', 'browsing', 'interactions with products', 'internet-connected devices', 'card number', 'operating system', 'battery level', 'storage space', 'browser type', 'bluetooth signals', 'nearby wi-fi', 'name of your mobile operator', 'mobile phone number', 'other devices that are nearby or on your network', 'websites you visit', 'purchases you make', 'ads you see', 'games you play', 'where you live', 'places you like to go', 'businesses and people you\'re near'],
    analytics: ['how you use features', 'time, frequency and duration of your activities', 'accounts you interact with', 'actions you take', 'features you use', 'content that you view', 'how you use our products', 'how you interact', 'page response times', 'download errors', 'length of visit', 'page interaction', 'scrolling', 'clicks', 'mouse-overs', 'mouse movements']
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
        policyResult[this] = checkForMatch(policy, searchList[this]);
    });

    //Find email addresses in privacy policy
    policyResult.email = policy.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);

    injectScript();
    updatePopup();
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
                injectScript();
            });
    } else {
        console.log('Paradox failed to find a Privacy Policy for this Website.');
        injectScript();
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