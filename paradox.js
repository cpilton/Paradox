function checkForRegisterButton() {
    let button;
    let buttons = document.getElementsByTagName('input');
    for (let i = 0; i < buttons.length; i++) {
        button = buttons[i];

        if (button.getAttribute('type') === 'submit') {
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
    for (let j = 0; j < buttons.length; j++) {
        button = buttons[j];
        if (button.getAttribute('type') === 'submit') {
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

let logoImage;
let tickImage;

let paradoxPolicy;

function appendPolicyToButton(button) {
    const existingStyles = getComputedStyle(button);

    const logo = document.createElement("div");
    logo.id = "paradox-popup-logo";
    logo.style.backgroundImage = 'url(' + logoImage + ')';

    const popup = document.createElement("div");
    popup.id = "paradox-popup";

    const content = document.createElement("div");
    content.id = "paradox-popup-content";
    //content.textContent = JSON.stringify(paradoxPolicy);

    const arrow = document.createElement("div");
    arrow.id = "paradox-popup-arrow";

    const top = document.createElement("div");
    top.id = "paradox-popup-top";
    top.textContent = "Paradox Policy Analysis";

    if (Object.entries(paradoxPolicy).length !== 0) {
        const containers = ["data-collection", "your-choices", "data-usage", "tracking"];

        containers.forEach((element) => {
            const container = document.createElement("div");
            container.className = "popup-container";
            container.id = element + '-container';

            const title = document.createElement("div");
            title.id = element + '-title';
            title.className = "popup-container-titles";

            const img = document.createElement("div");
            img.id = element + '-img';
            img.className = "popup-container-img";

            img.style.backgroundImage = 'url("' + tickImage + '")';
            img.style.backgroundColor = '#43A047';

            const text = document.createElement("div");
            text.className = "popup-container-text";
            text.id = element + '-text';

            const list = document.createElement("ul");
            list.className = "popup-container-list";
            list.id = element + '-list';

            title.textContent = element.replace('-', ' ');

            text.appendChild(list);
            title.appendChild(img);
            container.appendChild(title);
            container.appendChild(text);
            content.appendChild(container);
        });
    } else {
        const noPolicy = document.createElement("div");
        noPolicy.id = "popup-container-noPolicy";
        noPolicy.textContent = "No Privacy Policy was found. Check for one before continuing.";

        content.appendChild(noPolicy);

        popup.style.height = '100px';
    }

    let icon;

    const container = document.createElement("div");
    icon = document.createElement("div");

    icon.id = 'paradox-popup-logo-container';
    container.style.position = 'relative';
    const iconSize = existingStyles.height;
    icon.style.width = iconSize;
    icon.style.height = iconSize;
    icon.style.top = '-' + (parseInt(existingStyles.height) + parseInt(existingStyles.marginBottom)) + 'px';

    popup.appendChild(content);
    popup.appendChild(arrow);
    popup.appendChild(top);
    logo.appendChild(popup);
    icon.appendChild(logo);
    container.appendChild(icon);

    let parent = button.parentNode;

    while (parent.parentNode.tagName === 'SPAN') {
        parent = parent.parentNode;
    }

    parent.appendChild(container);

    updatePopup();
}

let warningImage;

window.postMessage({from: 'paradox', type: 'policyRequest'}, "*");

window.addEventListener("message", function (message) {
    if (message.data.from === 'content' && message.data.type === 'paradoxPolicy') {
        paradoxPolicy = message.data.policy;
        logoImage = message.data.icon;
        tickImage = message.data.tickImg;
        warningImage = message.data.warningImg;
        checkForRegisterButton();
    }
    return true;
});

function updatePopup() {
    let li;
    let img, liAppend;


    img = document.getElementById('data-collection-img');
    liAppend = document.getElementById('data-collection-list');
    let bp = document.createElement("div");
    if (paradoxPolicy.dataTypes.match) {
        img.style.backgroundImage = 'url("' + warningImage + '")';
        img.style.backgroundColor = '#FB8C00';

        li = document.createElement("li");
        li.textContent = "The following personal information may be collected:";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + warningImage + '")';
        bp.style.backgroundColor = '#FB8C00';

        li.appendChild(bp);
        liAppend.appendChild(li);

        li = document.createElement("li");
        li.textContent = paradoxPolicy.dataTypes.data.join(', ');
        li.className = 'popup-li-small';
        liAppend.appendChild(li);

    } else {
        img.style.backgroundImage = 'url("' + tickImage + '")';
        img.style.backgroundColor = '#43A047';

        li = document.createElement("li");
        li.textContent = "Your personal information will not be collected.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + tickImage + '")';
        bp.style.backgroundColor = '#43A047';

        li.appendChild(bp);
        liAppend.appendChild(li);
    }


    img = document.getElementById('your-choices-img');
    liAppend = document.getElementById('your-choices-list');
    if (!paradoxPolicy.informationRequest.match || !paradoxPolicy.rejectDataCollection.match || paradoxPolicy.rejectDataCollectionConsequence.match) {
        img.style.backgroundImage = 'url("' + warningImage + '")';
        img.style.backgroundColor = '#FB8C00';
    } else {
        img.style.backgroundImage = 'url("' + tickImage + '")';
        img.style.backgroundColor = '#43A047';
    }

    li = document.createElement("li");
    bp = document.createElement("div");
    if (!paradoxPolicy.informationRequest.match) {
        li.textContent = "The policy does not state that you can request a copy of your information, this is a breach of GDPR.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + warningImage + '")';
        bp.style.backgroundColor = '#FB8C00';

        li.appendChild(bp);
    } else {
        li.textContent = "You can request a copy of your information at any time.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + tickImage + '")';
        bp.style.backgroundColor = '#43A047';

        li.appendChild(bp);
    }
    liAppend.appendChild(li);

    li = document.createElement("li");
    bp = document.createElement("div");
    if (!paradoxPolicy.rejectDataCollection.match) {
        li.textContent = "You cannot reject data collection if you want to use this website.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + warningImage + '")';
        bp.style.backgroundColor = '#FB8C00';

        li.appendChild(bp);
    } else {
        li.textContent = "You can reject collection of your personal data.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + tickImage + '")';
        bp.style.backgroundColor = '#43A047';

        li.appendChild(bp);
    }
    liAppend.appendChild(li);

    if (paradoxPolicy.rejectDataCollectionConsequence.match) {
        li = document.createElement("li");
        bp = document.createElement("div");
        li.textContent = "There are consequences to rejecting data collection:";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + warningImage + '")';
        bp.style.backgroundColor = '#FB8C00';

        li.appendChild(bp);
        liAppend.appendChild(li);

        li = document.createElement("li");
        li.textContent = paradoxPolicy.rejectDataCollectionConsequence.data.join(', ');
        li.className = 'popup-li-small';

        liAppend.appendChild(li);
    } else {
        li = document.createElement("li");
        bp = document.createElement("div");
        li.textContent = "There are no stated consequences for rejecting data collection.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + tickImage + '")';
        bp.style.backgroundColor = '#43A047';

        li.appendChild(bp);
        liAppend.appendChild(li);
    }


    img = document.getElementById('data-usage-img');
    liAppend = document.getElementById('data-usage-list');
    if (paradoxPolicy.thirdPartySharing.match || paradoxPolicy.recommendations.match || !paradoxPolicy.dataSecurity.match) {
        img.style.backgroundImage = 'url("' + warningImage + '")';
        img.style.backgroundColor = '#FB8C00';
    } else {
        img.style.backgroundImage = 'url("' + tickImage + '")';
        img.style.backgroundColor = '#43A047';
    }

    li = document.createElement("li");
    bp = document.createElement("div");
    if (paradoxPolicy.thirdPartySharing.match) {
        li.textContent = "Your personal data may be sold to or shared with third-parties.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + warningImage + '")';
        bp.style.backgroundColor = '#FB8C00';

        li.appendChild(bp);
        liAppend.appendChild(li);
    } else {
        li.textContent = "Your personal data will not be sold or shared with third-parties.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + tickImage + '")';
        bp.style.backgroundColor = '#43A047';

        li.appendChild(bp);
        liAppend.appendChild(li);
    }

    li = document.createElement("li");
    bp = document.createElement("div");
    if (paradoxPolicy.recommendations.match) {
        li.textContent = "Your personal data may be analysed to recommend you products and/or services.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + warningImage + '")';
        bp.style.backgroundColor = '#FB8C00';

        li.appendChild(bp);
        liAppend.appendChild(li);
    } else {

        li.textContent = "Your personal data will not be used to recommend other products of services.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + tickImage + '")';
        bp.style.backgroundColor = '#43A047';

        li.appendChild(bp);
        liAppend.appendChild(li);
    }

    li = document.createElement("li");
    bp = document.createElement("div");
    if (!paradoxPolicy.dataSecurity.match) {
        li.textContent = "There is no mention of whether your data will be kept secure in the privacy policy.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + warningImage + '")';
        bp.style.backgroundColor = '#FB8C00';

        li.appendChild(bp);
        liAppend.appendChild(li);
    } else {

        li.textContent = "There are security measures in place to protect your personal data.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + tickImage + '")';
        bp.style.backgroundColor = '#43A047';

        li.appendChild(bp);
        liAppend.appendChild(li);
    }

    img = document.getElementById('tracking-img');
    liAppend = document.getElementById('tracking-list');
    if (paradoxPolicy.usabilityTracking.match || paradoxPolicy.advertising.match || paradoxPolicy.analytics.match || paradoxPolicy.cookies.match) {
        img.style.backgroundImage = 'url("' + warningImage + '")';
        img.style.backgroundColor = '#FB8C00';
    } else {
        img.style.backgroundImage = 'url("' + tickImage + '")';
        img.style.backgroundColor = '#43A047';
    }

    li = document.createElement("li");
    bp = document.createElement("div");
    if (paradoxPolicy.advertising.match) {
        li.textContent = "Your personal data may be used to show you personalised ads on this website and others.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + warningImage + '")';
        bp.style.backgroundColor = '#FB8C00';

        li.appendChild(bp);
        liAppend.appendChild(li);
    } else {

        li.textContent = "Your personal data will not be used to personalise the ads you see";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + tickImage + '")';
        bp.style.backgroundColor = '#43A047';

        li.appendChild(bp);
        liAppend.appendChild(li);
    }

    li = document.createElement("li");
    bp = document.createElement("div");
    if (paradoxPolicy.cookies.match) {
        li.textContent = "This website collects cookies, which may track your usage and provide information about your device.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + warningImage + '")';
        bp.style.backgroundColor = '#FB8C00';

        li.appendChild(bp);
        liAppend.appendChild(li);
    } else {

        li.textContent = "This website does not use cookies.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + tickImage + '")';
        bp.style.backgroundColor = '#43A047';

        li.appendChild(bp);
        liAppend.appendChild(li);
    }

    if (paradoxPolicy.analytics.match) {
        li = document.createElement("li");
        bp = document.createElement("div");

        li.textContent = "This website collects analytic data which tracks how you use their website, including:";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + warningImage + '")';
        bp.style.backgroundColor = '#FB8C00';

        li.appendChild(bp);
        liAppend.appendChild(li);

        li = document.createElement("li");

        li.textContent = paradoxPolicy.analytics.data.join(', ');
        li.className = 'popup-li-small';

        liAppend.appendChild(li);
    } else {
        li = document.createElement("li");
        bp = document.createElement("div");

        li.textContent = "This website does not capture analytic data.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + tickImage + '")';
        bp.style.backgroundColor = '#43A047';

        li.appendChild(bp);
        liAppend.appendChild(li);
    }

    li = document.createElement("li");
    bp = document.createElement("div");
    if (paradoxPolicy.usabilityTracking.match) {
        li.textContent = "Your usage of this website may be monitored to help the developers improve usability.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + warningImage + '")';
        bp.style.backgroundColor = '#FB8C00';

        li.appendChild(bp);
        liAppend.appendChild(li);
    } else {

        li.textContent = "Your usage of this website will not be collected to improve usability.";
        li.className = 'popup-li-big';

        bp.style.backgroundImage = 'url("' + tickImage + '")';
        bp.style.backgroundColor = '#43A047';

        li.appendChild(bp);
        liAppend.appendChild(li);
    }
}

(function (recorder) {
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;
    const setRequestHeader = XHR.setRequestHeader;

// Collect data:
    XHR.open = function (method, url) {
        this._requestHeaders = {};
        return open.apply(this, arguments);
    };

    XHR.setRequestHeader = function (header, value) {
        this._requestHeaders[header] = value;
        return setRequestHeader.apply(this, arguments);
    };

    XHR.send = function (postData) {
        this.addEventListener('load', function () {
            if (recorder) {

                if (postData) {
                    if (typeof postData === 'string' && JSON.stringify(postData).length) {
                        window.postMessage({
                            from: 'paradox',
                            type: 'corsInterception',
                            data: JSON.stringify(postData)
                        }, "*")
                    }
                }

                if (this.response && JSON.stringify(this.response).length) {
                    window.postMessage({
                        from: 'paradox',
                        type: 'corsInterception',
                        data: JSON.stringify(this.response)
                    }, "*")
                }
            }
        });
        return send.apply(this, arguments);
    };
})(XMLHttpRequest);