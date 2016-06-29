'use strict';

var createBuilder = require('./create-builder.js');

var BUILD_COMPLETE_EVENT = 'builderComplete';

process.on('message', function(message) {
    var options = JSON.parse(message);

    var builder = createBuilder(options.config);

    builder.buildSingle(options.target).bundle.on(BUILD_COMPLETE_EVENT, function() {
        process.send('done');
    });
});
