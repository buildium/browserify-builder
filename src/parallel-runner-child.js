'use strict';

var createBuilder = require('./create-builder.js');

process.on('message', function(message) {
    var options = JSON.parse(message);

    var builder = createBuilder(options.config, function() {
        process.send('done');
    });

    builder.buildSingle(options.target);
});
