'use strict';

var includes = require('lodash/includes');
var extend = require('lodash/fp/extend');
var flow = require('lodash/fp/flow');
var curry = require('lodash/fp/curry');
var map = require('lodash/fp/map');
var flatten = require('lodash/fp/flatten');
var values = require('lodash/fp/values');
var mkdirp = require('mkdirp');

var bundlerTools = require('./browserify-utils.js');

var defaultConfig = {
    watch: false,
    parallel: false,
    outputFilePattern: '[name].js',
    apps: {},
    shared: {},
    plugins: [],
    transforms: []
};

var getPath = function getPathFn(pattern, mod) {
    if (mod.path) {
        return mod.path;
    }
    return pattern.replace('[name]', mod.name);
};

var getModuleFromTarget = curry(function getTargetFn(config, target) {
    if (config.shared[target]) {
        return extend({name: target, type: 'shared'}, config.shared[target]);
    }
    return extend({name: target, type: 'app'}, config.apps[target]);
});

var getSharedLibs = flow(values, map('include'), flatten);

var addFilesToBundle = curry(function addFilesToBundleFn(config, mod) {
    if (mod.type === 'shared') {
        bundlerTools.configureSharedBundle(mod.bundle, mod.include, mod.exclude, mod.entry);
    } else {
        bundlerTools.configureAppBundle(mod.bundle, mod.entry, mod.exclude || getSharedLibs(config.shared));
    }
    return mod;
});

var addUglify = curry(function addUglifyFn(config, mod) {
    if (!config.uglify) {
        return mod;
    }
    return extend(mod, { uglify: config.uglify });
});

var createBundle = curry(function createBundleFn(config, mod) {
    return extend(mod, { bundle: bundlerTools.createBundle(config.options, mod.options, mod.name, config.watch, config.cacheFolder) } );
});

var addPlugins = curry(function addPluginsFn(config, mod) {
    bundlerTools.addPlugins(mod.bundle, config);
    return mod;
});

var addTransforms = curry(function addTransforms(config, mod) {
    bundlerTools.addTransforms(mod.bundle, config);
    return mod;
});

var setPath = curry(function setPathFn(config, mod) {
    return extend(mod, { path: getPath(config.outputFilePattern, mod) });
});

var configureModule = curry(function configureModuleFn(config, mod) {
    return flow(
        createBundle(config),
        addPlugins(config),
        addTransforms(config),
        addFilesToBundle(config),
        setPath(config),
        addUglify(config)
    )(mod);
});

var allEventsFinished = curry(function onAllFinished(event, callback, emitters) {
    var emitterCount = 0;
    emitters.forEach(function(emitter) {
        emitter.on(event, function() {
            emitterCount++;
            if (emitterCount === emitters.length) {
                callback();
            }
        });
    });
});

function createConfigureFlow(config) {
    return flow(
        getModuleFromTarget(config),
        configureModule(config)
    );
}

function getTargetList(config) {
    return Object.keys(config.shared).concat(Object.keys(config.apps));
}

module.exports = function bundler(userConfig, onDone) {
    var exports = {};
    var config = extend(defaultConfig, userConfig);
    var targets = getTargetList(config);
    var configureTarget = createConfigureFlow(config);
    var execOnDoneAfterFinished = allEventsFinished('builderComplete', onDone);

    if (config.cacheFolder) {
        mkdirp.sync(config.cacheFolder);
    }

    function build(bundles) {
        if (config.watch) {
            bundles.forEach(bundlerTools.watchBundle);
        } else {
            if (onDone) {
                execOnDoneAfterFinished(map('bundle', bundles));
            }
            bundles.forEach(bundlerTools.writeBundle);
        }
        return bundles;
    }

    exports.buildAll = function buildAll() {
        build(
            targets
                .map(configureTarget)
        );
    };

    exports.buildSingle = function buildSingle(userTarget) {
        return build(
            targets
                .filter(function(item) {
                    return item === userTarget;
                })
                .map(configureTarget)
        )[0];
    };

    exports.buildMulti = function buildMulti(userTargets) {
        return build(
            targets
                .filter(function(item) {
                    return includes(userTargets, item);
                })
                .map(configureTarget)
        );
    };

    exports.getBundles = function getBundleList() {
        return targets
            .map(configureTarget);
    };

    return exports;
};
