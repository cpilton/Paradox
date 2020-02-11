// Once the DOM is ready...
window.addEventListener('DOMContentLoaded', () => {
    // ...query for the active tab...
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => {
        // ...and send a request for the DOM info...
        chrome.tabs.sendMessage(
            tabs[0].id,
            {from: 'popup', subject: 'DOMInfo'},
             function updatePopup(response) {
                 parseReponse(response)
             });
    });
});

function parseReponse(data) {
    console.log(data);


    document.getElementById('tracking-cookies-value').textContent = data.cookies.length;

    if(Number.isInteger(data.storage.length)) {
        document.getElementById('local-storage-value').textContent = data.storage.length;
    } else {
        document.getElementById('local-storage-value').textContent = Object.keys(data.storage).length;
    }

    document.getElementById('cors-value').textContent = data.cors.length;
}
console.log('hi');

