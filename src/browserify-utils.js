'use strict';

var extend = require('lodash/fp/extend');
var fs = require('fs');
var browserify = require('browserify');
var browserifyInc = require('browserify-incremental');
var watchify = require('watchify');
var path = require('path');
var incrementalWatch = require('./incremental-watch.js');
var uglify = require('uglify-js');
var mkdirp = require('mkdirp');

function uglifyFile(path, options, callback) {
    var result = uglify.minify(path, options);
    fs.writeFile(path, result.code, function(err) {
        callback(err);
    });
}

exports.writeBundle = function writeBundle(config) {
    var promise = new Promise(function(resolve) {
        mkdirp(path.dirname(config.path), function(err) {
            config.bundle.bundle()
                .pipe(fs.createWriteStream(config.path))
                .on('finish', function() {
                    console.log('Built ' + config.name);
                    if (config.uglify) {
                        uglifyFile(config.path, config.uglify, function(err) {
                            if (!err) {
                                console.log('Minified ' + config.name);
                            }
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                });
        });
    });

    return promise;
};

exports.watchBundle = function watchBundle(config) {
    var bundle = config.bundle;
    bundle.on('update', function() {
        exports.writeBundle(config)
            .on('error', function(err) {
                console.log(err.message);
                this.emit('end');
            });
    });
    exports.writeBundle(config);
    return bundle;
};

exports.addTransforms = function addTransforms(bundler, config) {
    config.transforms.forEach(function(transform) {
        var transformFunc;
        if (transform.type === 'function') {
            transformFunc = require(transform.name);
            bundler.transform(transformFunc.apply(null, transform.params), transform.options);
        } else {
            bundler.transform(transform.name, transform.options);
        }
    });
    return bundler;
};

exports.addPlugins = function addPlugins(bundler, config) {
    if (config.watch) {
        bundler.plugin(watchify, config.watchOptions);
    }
    if (config.cacheFolder) {
        bundler.plugin(incrementalWatch);
    }
    config.plugins.forEach(function(plugin) {
        bundler.plugin(plugin.name, plugin.options);
    });
    return bundler;
};

exports.configureAppBundle = function configureAppBundle(bundler, entry, exclude) {
    bundler.add(entry);
    bundler.external(exclude);

    return bundler;
};

exports.configureSharedBundle = function configureSharedBundle(bundler, include, exclude, entry) {
    if (exclude) {
        bundler.external(exclude);
    }
    bundler.require(include);
    if (entry) {
        bundler.add(entry);
    }

    return bundler;
};

exports.createBundle = function createBundle(globalOptions, bundleOptions, name, watch, cacheFolder) {
    var options = extend(globalOptions, bundleOptions);
    if (watch) {
        //required watchify settings
        options.cache = {};
        options.packageCache = {};
    }
    if (cacheFolder) {
        return browserifyInc(
            extend(
                options, {
                    cacheFile: path.join(cacheFolder, name + '.cache.json')
                }
            )
        );
    } else {
        return browserify(options);
    }
};

module.exports = exports;
