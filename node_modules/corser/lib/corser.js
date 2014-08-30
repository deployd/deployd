/**
 * Specification: http://www.w3.org/TR/2012/WD-cors-20120403/
 * W3C Working Draft 3 April 2012
 */
"use strict";

var simpleMethods, simpleRequestHeaders, simpleResponseHeaders, toLowerCase;

// A method is said to be a simple method if it is a case-sensitive match for one of the following:
Object.defineProperty(exports, "simpleMethods", {
    get: function () {
        return [
            "GET",
            "HEAD",
            "POST"
        ];
    }
});
simpleMethods = exports.simpleMethods;

// A header is said to be a simple header if the header field name is an ASCII case-insensitive match for one of
// the following:
Object.defineProperty(exports, "simpleRequestHeaders", {
    get: function () {
        return [
            "accept",
            "accept-language",
            "content-language",
            "content-type"
        ];
    }
});
simpleRequestHeaders = exports.simpleRequestHeaders;

// A header is said to be a simple response header if the header field name is an ASCII case-insensitive
// match for one of the following:
Object.defineProperty(exports, "simpleResponseHeaders", {
    get: function () {
        return [
            "cache-control",
            "content-language",
            "content-type",
            "expires",
            "last-modified",
            "pragma"
        ];
    }
});
simpleResponseHeaders = exports.simpleResponseHeaders;

toLowerCase = function (array) {
    return array.map(function (el) {
        return el.toLowerCase();
    });
};

exports.create = function (options) {
    options = options || {};
    options.origins = options.origins || [];
    options.methods = options.methods || simpleMethods;
    if (options.hasOwnProperty("requestHeaders") === true) {
        options.requestHeaders = toLowerCase(options.requestHeaders);
    } else {
        options.requestHeaders = simpleRequestHeaders;
    }
    if (options.hasOwnProperty("responseHeaders") === true) {
        options.responseHeaders = toLowerCase(options.responseHeaders);
    } else {
        options.responseHeaders = simpleResponseHeaders;
    }
    options.maxAge = options.maxAge || null;
    options.supportsCredentials = options.supportsCredentials || false;
    return function (req, res, next) {
        var originMatches, methodMatches, headersMatch, requestMethod, requestHeaders, exposedHeaders;
        // If the Origin header is not present terminate this set of steps.
        if (!req.headers.hasOwnProperty("origin")) {
            // The request is outside the scope of the CORS specification. If there is no Origin header,
            // it could be a same-origin request. Let's let the user-agent handle this situation.
            next();
        } else {
            // If the value of the Origin header is not a case-sensitive match for any of the values in
            // list of origins, do not set any additional headers and terminate this set of steps.
            originMatches = false;
            if (options.origins.length > 0) {
                options.origins.forEach(function (optionsOrigin) {
                    if (optionsOrigin === req.headers.origin) {
                        originMatches = true;
                    }
                });
            } else {
                // Always matching is acceptable since the list of origins can be unbounded.
                originMatches = true;
            }
            if (originMatches === false) {
                next();
            } else {
                // Respond to preflight request.
                if (req.method === "OPTIONS") {
                    // If there is no Access-Control-Request-Method header or if parsing failed, do not set
                    // any additional headers and terminate this set of steps.
                    if (!req.headers.hasOwnProperty("access-control-request-method")) {
                        next();
                    } else {
                        requestMethod = req.headers["access-control-request-method"];
                        // If there are no Access-Control-Request-Headers headers let header field-names be the
                        // empty list. If parsing failed do not set any additional headers and terminate this set
                        // of steps.
                        if (req.headers.hasOwnProperty("access-control-request-headers")) {
                            requestHeaders = toLowerCase(req.headers["access-control-request-headers"].split(/,\s*/));
                        } else {
                            requestHeaders = [];
                        }
                        // If method is not a case-sensitive match for any of the values in list of methods do not
                        // set any additional headers and terminate this set of steps.
                        methodMatches = false;
                        options.methods.forEach(function (optionsMethod) {
                            if (optionsMethod === requestMethod) {
                                methodMatches = true;
                            }
                        });
                        if (methodMatches === false) {
                            next();
                        } else {
                            // If any of the header field-names is not a ASCII case-insensitive match for any of
                            // the values in list of headers do not set any additional headers and terminate this
                            // set of steps.
                            headersMatch = 0;
                            requestHeaders.forEach(function (requestHeader) {
                                var requestHeaderMatches;
                                requestHeaderMatches = false;
                                // Browsers automatically add Origin to Access-Control-Request-Headers. However,
                                // Origin is not one of the simple request headers. Therefore, the header is
                                // accepted even if it is not in the list of request headers because CORS would
                                // not work without it.
                                if (requestHeader.match(/origin/i)) {
                                    requestHeaderMatches = true;
                                } else {
                                    options.requestHeaders.forEach(function (optionsRequestHeader) {
                                        if (requestHeader === optionsRequestHeader) {
                                            requestHeaderMatches = true;
                                        }
                                    });
                                }
                                if (requestHeaderMatches === true) {
                                    headersMatch = headersMatch + 1;
                                }
                            });
                            if (headersMatch !== requestHeaders.length) {
                                next();
                            } else {
                                if (options.supportsCredentials === true) {
                                    // If the resource supports credentials add a single Access-Control-Allow-Origin
                                    // header, with the value of the Origin header as value, and add a single
                                    // Access-Control-Allow-Credentials header with the literal string "true"
                                    // as value.
                                    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
                                    res.setHeader("Access-Control-Allow-Credentials", "true");
                                } else {
                                    // Otherwise, add a single Access-Control-Allow-Origin header, with either the
                                    // value of the Origin header or the string "*" as value.
                                    if (options.origins.length > 0) {
                                        res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
                                    } else {
                                        res.setHeader("Access-Control-Allow-Origin", "*");
                                    }
                                }
                                // Optionally add a single Access-Control-Max-Age header with as value the amount
                                // of seconds the user agent is allowed to cache the result of the request.
                                if (options.maxAge !== null) {
                                    res.setHeader("Access-Control-Max-Age", options.maxAge);
                                }
                                // Add one or more Access-Control-Allow-Methods headers consisting of (a subset
                                // of) the list of methods.
                                res.setHeader("Access-Control-Allow-Methods", options.methods.join(","));
                                // Add one or more Access-Control-Allow-Headers headers consisting of (a subset
                                // of) the list of headers.
                                res.setHeader("Access-Control-Allow-Headers", options.requestHeaders.join(","));
                                // And out.
                                next();
                            }
                        }
                    }
                } else {
                    if (options.supportsCredentials === true) {
                        // If the resource supports credentials add a single Access-Control-Allow-Origin header,
                        // with the value of the Origin header as value, and add a single
                        // Access-Control-Allow-Credentials header with the literal string "true" as value.
                        res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
                        res.setHeader("Access-Control-Allow-Credentials", "true");
                    } else {
                        // Otherwise, add a single Access-Control-Allow-Origin header, with either the value of
                        // the Origin header or the literal string "*" as value.
                        // If the list of origins is empty, use "*" as value.
                        if (options.origins.length > 0) {
                            res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
                        } else {
                            res.setHeader("Access-Control-Allow-Origin", "*");
                        }
                    }
                    // If the list of exposed headers is not empty add one or more Access-Control-Expose-Headers
                    // headers, with as values the header field names given in the list of exposed headers.
                    exposedHeaders = [];
                    options.responseHeaders.forEach(function (optionsResponseHeader) {
                        var isSimpleResponseHeader;
                        isSimpleResponseHeader = false;
                        simpleResponseHeaders.forEach(function (simpleResponseHeader) {
                            if (optionsResponseHeader === simpleResponseHeader) {
                                isSimpleResponseHeader = true;
                            }
                        });
                        if (isSimpleResponseHeader === false) {
                            exposedHeaders.push(optionsResponseHeader);
                        }
                    });
                    if (exposedHeaders.length > 0) {
                        res.setHeader("Access-Control-Expose-Headers", exposedHeaders.join(","));
                    }
                    // And out.
                    next();
                }
            }
        }
    };
};
