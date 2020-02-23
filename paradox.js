(function(recorder) {
    var XHR = XMLHttpRequest.prototype;

    var open = XHR.open;
    var send = XHR.send;
    var setRequestHeader = XHR.setRequestHeader;

// Collect data:
    XHR.open = function(method, url) {
        this._method = method;
        this._url = url;
        this._requestHeaders = {};
        this._startTime = (new Date()).toISOString();
        return open.apply(this, arguments);
    };

    XHR.setRequestHeader = function(header, value) {
        this._requestHeaders[header] = value;
        return setRequestHeader.apply(this, arguments);
    };

    XHR.send = function(postData) {
        this.addEventListener('load', function() {
            var endTime = (new Date()).toISOString();

            if (recorder) {
                var myUrl = this._url ? this._url.toLowerCase() : this._url;
                if(myUrl) {

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
                        } catch(err) {
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

var convertToFullUrl = function(href) {
   // console.log(href);
    //$('#extension-data').append(href);
    return href;
}

function parseResponseHeaders(headers) {
    //console.log(headers);
    //$('#extension-data').append(headers);
    return headers;
}
