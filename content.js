var cors = [];
let cookies;
let storage;
let policyResult = {};
const s = document.createElement('script');
var homeRequestAttempted = false;

//Read Chrome Messages
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.subject === 'getParadoxObject') {
            var paradoxObject = {
                url: window.location.hostname,
                cookies: cookies,
                storage: storage,
                cors: cors,
                policy: policyResult,
                type: 'load',
            };
            sendResponse(paradoxObject);
            chrome.runtime.sendMessage({
                from: 'content',
                subject: 'initialData',
                data: paradoxObject
            });
        }
        if (request.from === 'background' && request.subject === 'corsRequest') {
            handleCORSResponse(request);
        }
        if (request.from === 'background' && request.subject === 'homeRequest') {
            handleHomeRequest(request);
        }
        if (request.from === 'popup' && request.subject === 'retry') {
            getData();
        }
    }
);

getData();

function getData() {
    cookies = getCookies();
    storage = getLocalStorage();

    getPolicy(findPrivacyPolicy());

    updatePopup();
}

window.addEventListener("message", function (message) {
    if (message.data.from == 'paradox' && message.data.type == 'policyRequest') {
        window.postMessage({
            from: 'content',
            type: 'paradoxPolicy',
            policy: policyResult,
            icon: chrome.extension.getURL("/public/img/logo.svg"),
            tickImg: chrome.extension.getURL("/public/img/tick.svg"),
            warningImg: chrome.extension.getURL("/public/img/warning.svg")
        }, "*");
    }
    if(message.data.from == 'paradox' && message.data.type == 'corsInterception') {
        addCors(message.data.data)
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

function addCors(data) {
    if (cors.indexOf(data) == -1) {
        cors.push(data);
    }
    updatePopup();
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

//Send updates to popup
function updatePopup() {
    chrome.runtime.sendMessage({
        msg: "data_update",
        data: {
            url: window.location.hostname,
            cookies: cookies,
            storage: storage,
            cors: cors,
            policy: policyResult,
            type: 'update'
        }
    });
}

const searchList = {
    cookies: ['use cookies', 'unique identifiers', 'cookies stored on your device', 'collect information about you via cookie', 'session cookies', 'persistent cookies', 'third-party cookies'],
    directDataCollection: ['face recognition technology', 'information you give us', 'information you provide', 'content you provide', 'When you are asked to fill in a form '],
    externalDataCollection: ['partners provide information about your activities', 'advertisers, app developers and publishers can send us information', 'information about you from other sources', 'information that other people provide'],
    usabilityTracking: ['improve our products', 'provide functionality', 'analyse performance', 'fix errors', 'improve usability'],
    recommendations: ['give you tips', 'recommend features', 'recommend products', 'recommend services', 'personalise your experience', 'make suggestions for you'],
    advertising: ['Display Advertising', 'personalise ads', 'sponsored content', 'we choose the ads that you see', 'third-party advertising', 'third party advertising partners', 'advertising', ' interest-based ads', ' interest-based advertisements'],
    thirdPartySharing: ['remarketing and other advertising services and features', 'we share information about you', 'sharing with third-party partners', 'we might sell or buy', 'share the information', 'shared with third parties', 'provided by third parties', 'third party is involved in your transactions', 'share customer information related to those transactions with that third party', 'other companies', 'other individuals', 'other companies and individuals', 'third-party service providers have access to personal information'],
    dataRelease: ['we release account', 'we release personal', 'exchanging information'],
    dataSecurity: ['SSL', 'protect the security', 'PCI DSS', 'security procedures', 'security features', 'security safeguards', 'incident response', 'SSH', 'TLS', 'committed to keeping your information secure'],
    informationRequest: ['you have the right to access', 'can access your information', 'access your personal', 'information request', 'right to request access', 'right to ask for information', 'subject access rights', 'you can ask us to provide you with the personal information we hold about you'],
    rejectDataCollection: ['can opt-out', 'you can disable cookies', 'right to object', 'you can choose not to provide', 'withdraw your consent', 'able to opt out', 'object to our processing of your personal data'],
    rejectDataCollectionConsequence: ['some parts of our website might not work properly for you', 'not be able to take advantage', 'not be able to add items to your shopping basket'],
    dataRetention: ['we store data until it is no longer necessary', 'until your account is deleted', 'keep a copy of the previous version', 'keep your personal', 'as long as it is required'],
    dataTypes: ['gender', 'qualifications', 'dietary requirements', 'search results', 'address book', 'call log', 'SMS log', 'contacts', 'images', 'videos', 'files', 'name', 'email address', 'phone number', 'payment information', 'user agent', 'location', 'friends', 'religious views', 'political views', 'your health', 'ethnic origin', 'philosophical beliefs', 'people', 'voice recordings', 'documents', 'financial information', 'credit history', 'VAT number', 'device log file', 'Wi-Fi credentials', 'internet protocol', 'IP address', 'password', 'device metrics', 'connectivity data', 'searched for', 'browsing', 'interactions with products', 'internet-connected devices', 'card number', 'operating system', 'battery level', 'storage space', 'browser type', 'bluetooth signals', 'nearby Wi-Fi', 'name of your mobile operator', 'mobile phone number', 'other devices that are nearby or on your network', 'websites you visit', 'purchases you make', 'ads you see', 'games you play', 'where you live', 'places you like to go', 'businesses and people you\'re near'],
    analytics: ['Google Analytics', 'links they interact with', 'how website visitors have interacted with web pages', 'how you use features', 'time, frequency and duration of your activities', 'accounts you interact with', 'actions you take', 'features you use', 'content that you view', 'how you use our products', 'how you interact', 'page response times', 'download errors', 'length of visit', 'page interaction', 'scrolling', 'clicks', 'mouse-overs', 'mouse movements']
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
    var url;

    var multipleURLs = false;

    $('a').each(function () {
        if ($(this).attr('href') !== undefined && $(this).attr('href').toLowerCase().indexOf('privacy') !== -1 && $(this).text().toLowerCase().indexOf('privacy') !== -1) {
            if (!multipleURLs) {
                url = $(this).attr('href');
                multipleURLs = true;
            } else {
                if ($(this).text().toLowerCase().indexOf('privacy policy') !== -1 || $(this).text().toLowerCase().indexOf('privacy notice') !== -1) {
                    if ($(this).attr('href').length < url) {
                        url = $(this).attr('href');
                    }
                }
            }
        }
    });

    if (url !== undefined) {
        return createReachableURL(url);
    }
}

function findRemotePrivacyPolicy(webpage) {
    var html = $.parseHTML(webpage);

    var url;

    var multipleURLs = false;

    $(html).find('a').each(function () {
        if ($(this).attr('href') !== undefined && $(this).attr('href').toLowerCase().indexOf('privacy') !== -1 && $(this).text().toLowerCase().indexOf('privacy') !== -1) {
            console.log($(this).attr('href'));
            if (!multipleURLs) {
                url = $(this).attr('href');
                multipleURLs = true;
            } else {
                if ($(this).text().toLowerCase().indexOf('privacy policy') !== -1 || $(this).text().toLowerCase().indexOf('privacy notice') !== -1) {
                    if ($(this).attr('href').length < url) {
                        url = $(this).attr('href');
                    }
                }
            }
        }
    });

    if (url !== undefined) {
        return createReachableURL(url);
    }

}

function createReachableURL(url) {
    if (url.indexOf('http://') === -1 && url.indexOf('https://') === -1) {

        while (url.indexOf('/') == 0) {
            url = url.substring(1);
        }

        if (url.indexOf('.') == -1 || (url.indexOf('.') > url.indexOf('/'))) {
            url = window.location.hostname + '/' + url;
        }

        url = 'https://' + url;
        url = url.replace(/([^:]\/)\/+/g, "$1");
    }
    return url;
}

function requestHomePage() {
    chrome.runtime.sendMessage({
        from: 'content',
        subject: 'homeRequest',
        link: 'http://' + window.location.hostname
    });
}

function handleHomeRequest(response) {
    if (response.status === 'success') {

        //Regex for scripts, images, comments, and blank lines
        var regex = [/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, /(<!--.*?-->)|(<!--[\S\s]+?-->)|(<!--[\S\s]*?$)/g, /^\s*$(?:\r\n?|\n)/gm];

        //Remove unwanted text
        $(regex).each(function () {
            while (this.test(response.data)) {
                response.data = response.data.replace(this, "");
            }
        });

        getPolicy(findRemotePrivacyPolicy(response.data));
    } else if (response.status === 'failed') {
        console.log('Paradox failed to get the website root. Error: ' + response.data);
        injectScript();
    }
}

function makeCORSRequest(link) {
    chrome.runtime.sendMessage({
        from: 'content',
        subject: 'CORSrequest',
        link: link
    });
}

function handleCORSResponse(response) {
    if (response.status === 'success') {
        parsePolicy(response.data);
    } else if (response.status === 'failed') {
        console.log('Paradox failed to get the Privacy Policy. Error: ' + response.data);
        injectScript();
    }
}

//Get the policy as a string
function getPolicy(link) {
    if (link !== undefined) {
        console.log('Paradox is loading the Privacy Policy from: ' + link);
        makeCORSRequest(link);
    } else {
        if (!homeRequestAttempted) {
            homeRequestAttempted = true;
            console.log('Paradox failed to find a Privacy Policy on this page, requesting website root: https://' + window.location.hostname);
            requestHomePage();
        } else {
            console.log('Paradox failed to find a Privacy Policy for this website on this page, or the website root. It probably doesn\'t have one');
            injectScript();
        }
    }
}

//Check the privacy policy for pre-defined strings
function checkForMatch(dataString, wordList) {
    var count = 0;
    var matches = [];

    //Check the policy for a string, and if found increase counter and push string to matches
    $(wordList).each(function () {
        if (dataString.search(this.toLowerCase()) != -1) {
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