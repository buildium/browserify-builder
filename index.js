'use strict';

var createBuilder = require('./src/create-builder');
var createParallelBuilder = require('./src/parallel-runner.js');

module.exports = function createParallelOrNormalBuilder(config, onDone) {
    if (config.parallel && !config.watch) {
        return createParallelBuilder(config, onDone);
    } else {
        return createBuilder(config, onDone);
    }
};
