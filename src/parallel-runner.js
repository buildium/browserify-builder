'use strict';

var childProcess = require('child_process');
var path = require('path');
var times = require('lodash/times');

function BrowserifyBuildQueue(config, workers, onDone) {
    this.workers = workers;
    this.config = config;
    this.running = 0;
    this.onDone = onDone;
}

BrowserifyBuildQueue.prototype.start = function startFn(tasks) {
    this.running = 0;
    this.tasks = tasks;
    this.children = this.createPool();
    this.children.forEach(function(child) {
        if (tasks.length > 0) {
            this.running++;
            this.run(child, tasks.shift());
        }
    }, this);
};

BrowserifyBuildQueue.prototype.createPool = function createPool() {
    var self = this;
    return times(this.workers, function() {
        var child = childProcess.fork(path.join(path.dirname(__filename), 'parallel-runner-child.js'));

        child.on('message', function(msg) {
            if (msg === 'done') {
                self.onChildDone(child);
            }
        });

        child.on('exit', function(exitCode) {
            if (exitCode !== 0) {
                self.onDone(false);
            }
        });

        return child;
    });
};

BrowserifyBuildQueue.prototype.run = function runFn(child, target) {
    child.send(JSON.stringify({target: target, config: this.config}));
};

BrowserifyBuildQueue.prototype.onChildDone = function onChildDone(child) {
    if (this.tasks.length > 0) {
        this.run(child, this.tasks.shift());
    } else {
        this.running--;
        child.disconnect();
        if (this.running === 0 && this.onDone) {
            this.onDone();
        }
    }
};

module.exports = function parallelBuilder(config, onDone) {
    var queue = new BrowserifyBuildQueue(config, config.parallel, onDone);
    var allTargets = Object.keys(config.shared).concat(Object.keys(config.apps));

    return {
        buildAll: function buildAllFn() {
            queue.start(allTargets);
        },
        buildMulti: function buildMultiFn(targets) {
            queue.start(targets);
        },
        buildSingle: function buildSingleFn(target) {
            queue.start([target]);
        }
    };
};

