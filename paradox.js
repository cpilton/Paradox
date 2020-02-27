(function (recorder) {
    var XHR = XMLHttpRequest.prototype;

    var open = XHR.open;
    var send = XHR.send;
    var setRequestHeader = XHR.setRequestHeader;

// Collect data:
    XHR.open = function (method, url) {
        this._method = method;
        this._url = url;
        this._requestHeaders = {};
        this._startTime = (new Date()).toISOString();
        return open.apply(this, arguments);
    };

    XHR.setRequestHeader = function (header, value) {
        this._requestHeaders[header] = value;
        return setRequestHeader.apply(this, arguments);
    };

    XHR.send = function (postData) {
        this.addEventListener('load', function () {
            var endTime = (new Date()).toISOString();

            if (recorder) {
                var myUrl = this._url ? this._url.toLowerCase() : this._url;
                if (myUrl) {

                    var requestModel = {
                        'uri': convertToFullUrl(this._url),
                        'verb': this._method,
                        'time': this._startTime,
                        'headers': this._requestHeaders
                    };

                    if (postData) {
                        if (typeof postData === 'string') {
                            var msg = {};
                            msg.data = postData;
                            msg.type = 'paradoxCORSEvent';
                            msg.format = 'string';
                            msg.from = 'paradox';

                            window.postMessage(msg, "*");

                        } else if (typeof postData === 'object' || typeof postData === 'array' || typeof postData === 'number' || typeof postData === 'boolean') {
                            requestModel['body'] = postData;
                        }
                    }

                    var responseHeaders = parseResponseHeaders(this.getAllResponseHeaders());

                    var responseModel = {
                        'status': this.status,
                        'time': endTime,
                        'headers': responseHeaders
                    };


                    if (this.responseText) {
                        try {
                            responseModel['body'] = _.JSONDecode(this.responseText);
                        } catch (err) {
                            responseModel['transfer_encoding'] = 'base64';
                            responseModel['body'] = _.base64Encode(this.responseText);
                        }
                    }

                    var event = {
                        'request': requestModel,
                        'response': responseModel
                    };

                    event.type = 'paradoxCORSEvent';
                    event.format = 'json';
                    event.from = 'paradox';

                    window.postMessage(event, "*");


                    recorder(event);
                }
            }
        });
        return send.apply(this, arguments);
    };

    var undoPatch = function () {
        XHR.open = open;
        XHR.send = send;
        XHR.setRequestHeader = setRequestHeader;
    };

    return undoPatch;

})(XMLHttpRequest);

var convertToFullUrl = function (href) {
    return href;
}

function parseResponseHeaders(headers) {
    return headers;
}

function checkForRegisterButton() {
    var buttons = document.getElementsByTagName('input');
    for (var i = 0; i < buttons.length; i++) {
        var button = buttons[i];

        if (button.getAttribute('type') == 'submit') {
            if (button.innerHTML !== undefined && (button.innerHTML.toLowerCase().indexOf('register') !== -1 || button.innerHTML.toLowerCase().indexOf('sign up') !== -1 || (button.innerHTML.toLowerCase().indexOf('create') !== -1 && button.innerHTML.toLowerCase().indexOf('account') !== -1))) {
                appendPolicyToButton(button);
                break;
            } else if (button.nextSibling !== null && button.nextSibling.innerHTML !== undefined && (button.nextSibling.innerHTML.toLowerCase().indexOf('register') !== -1 || button.nextSibling.innerHTML.toLowerCase().indexOf('sign up') !== -1 || (button.nextSibling.innerHTML.toLowerCase().indexOf('create') !== -1 && button.nextSibling.innerHTML.toLowerCase().indexOf('account') !== -1))) {
                appendPolicyToButton(button.nextSibling);
                break;
            } else if (button.getAttribute('value') !== null && button.getAttribute('value') !== undefined && (button.getAttribute('value').toLowerCase().indexOf('register') !== -1 || button.getAttribute('value').toLowerCase().indexOf('sign up') !== -1 || (button.getAttribute('value').toLowerCase().indexOf('create') !== -1 && button.getAttribute('value').toLowerCase().indexOf('account') !== -1))) {
                appendPolicyToButton(button);
                break;
            }
        }
    }

    buttons = document.getElementsByTagName('button');
    for (var i = 0; i < buttons.length; i++) {
        var button = buttons[i];
        if (button.getAttribute('type') == 'submit') {
            if (button.innerHTML !== undefined && (button.innerHTML.toLowerCase().indexOf('register') !== -1 || button.innerHTML.toLowerCase().indexOf('sign up') !== -1 || (button.innerHTML.toLowerCase().indexOf('create') !== -1 && button.innerHTML.toLowerCase().indexOf('account') !== -1))) {
                appendPolicyToButton(button);
                break;
            } else if (button.nextSibling !== null && button.nextSibling.innerHTML !== undefined && (button.nextSibling.innerHTML.toLowerCase().indexOf('register') !== -1 || button.nextSibling.innerHTML.toLowerCase().indexOf('sign up') !== -1 || (button.nextSibling.innerHTML.toLowerCase().indexOf('create') !== -1 && button.nextSibling.innerHTML.toLowerCase().indexOf('account') !== -1))) {
                appendPolicyToButton(button.nextSibling);
                break;
            } else if (button.getAttribute('value') !== null && button.getAttribute('value') !== undefined && (button.getAttribute('value').toLowerCase().indexOf('register') !== -1 || button.getAttribute('value').toLowerCase().indexOf('sign up') !== -1 || (button.getAttribute('value').toLowerCase().indexOf('create') !== -1 && button.getAttribute('value').toLowerCase().indexOf('account') !== -1))) {
                appendPolicyToButton(button);
                break;
            }
        }
    }
}

function appendPolicyToButton(button) {
    var existingStyles = getComputedStyle(button);

    var logo = document.createElement("div");
    logo.id = "paradox-popup-logo";
    logo.style.backgroundImage = 'url(' + logoImage + ')';

    var popup = document.createElement("div");
    popup.id = "paradox-popup";

    var content = document.createElement("div");
    content.id = "paradox-popup-content";
    content.textContent = JSON.stringify(paradoxPolicy);

    var arrow = document.createElement("div");
    arrow.id = "paradox-popup-arrow";

    var icon;

    var container = document.createElement("div");
    icon = document.createElement("div");

    icon.id = 'paradox-popup-logo-container';
    container.style.position = 'relative';
    icon.style.width = existingStyles.height;
    icon.style.height = existingStyles.height;
    icon.style.top = '-' + (parseInt(existingStyles.height) + parseInt(existingStyles.marginBottom)) + 'px';

    popup.appendChild(arrow);
    popup.appendChild(content);
    logo.appendChild(popup);
    icon.appendChild(logo);
    container.appendChild(icon);

    var parent = button.parentNode;

    while (parent.parentNode.tagName === 'SPAN') {
        parent = parent.parentNode;
    }

    parent.appendChild(container);
}

var paradoxPolicy;
var logoImage;

window.postMessage({from: 'paradox', type: 'policyRequest'}, "*");

window.addEventListener("message", function (message) {
    if (message.data.from == 'content' && message.data.type == 'paradoxPolicy') {
        paradoxPolicy = message.data.policy;
        console.log(paradoxPolicy);
        logoImage = message.data.icon;
        checkForRegisterButton();
    }
});