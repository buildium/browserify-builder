'use strict';

var BrowserifyCache = require('browserify-cache-api');

module.exports = function incrementalWatchPlugin(b) {
    var hasReadCache = false;
    b.on('bundle', function() {
        var cache = BrowserifyCache.getCache(b);
        if (!hasReadCache && cache) {
            Object.keys(cache.dependentFiles).forEach(function(file) {
                b.emit('file', file);
            });
            Object.keys(cache.modules).forEach(function(file) {
                b.emit('file', file);
            });
        }
        hasReadCache = true;
    });
};
