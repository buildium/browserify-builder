var chai = require('chai');
var sinon = require('sinon');
chai.should();
chai.use(require('sinon-chai'));
chai.use(require('chai-deep-match'));

var bundlerTools = require('../src/browserify-utils');
var createBuilder = require('../src/create-builder');

describe('create-builder', function() {
    var config,
        sandbox;

    beforeEach(function() {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
        sandbox.restore();
    });

    beforeEach(function() {
        config = {
            watch: false,
            parallel: false,
            outputFilePattern: '[name].js',
            apps: {},
            shared: {},
            plugins: [],
            transforms: []
        };
    })

    it('should create a builder', function() {
        var builder = createBuilder(config);
        builder.should.be.defined;
        builder.should.respondTo('buildAll');
        builder.should.respondTo('buildSingle');
        builder.should.respondTo('buildMulti');
        builder.should.respondTo('getBundles');
    });

    describe('getBundles', function() {
        it('should return an array of bundle configurations', function() {
            var builder = createBuilder(config);
            builder.getBundles().should.be.instanceof(Array);
        });

        it('should return bundle configurations for each app config given', function() {
            config.apps = {
                hello: {
                    entry: 'hello.js'
                },
                world: {
                    entry: 'world.js'
                }
            };

            var bundles = createBuilder(config).getBundles();

            bundles.should.deep.match([{
                type: 'app',
                entry: 'hello.js',
                name: 'hello'
            }, {
                type: 'app',
                entry: 'world.js',
                name: 'world'
            }]);
        });

        it('should return bundle configurations for each shared config given', function() {
            config.shared = {
                hello: {
                    entry: 'hello.js'
                },
                world: {
                    entry: 'world.js'
                }
            };

            var bundles = createBuilder(config).getBundles();

            bundles.should.deep.match([{
                type: 'shared',
                entry: 'hello.js',
                name: 'hello'
            }, {
                type: 'shared',
                entry: 'world.js',
                name: 'world'
            }]);
        });

        it('should call createBundle for each config given', function() {
            config.apps = {
                hello: {
                    entry: 'hello.js'
                }
            };

            sandbox.spy(bundlerTools, 'createBundle');

            var bundles = createBuilder(config).getBundles();
            bundlerTools.createBundle.should.have.been.calledOnce;

            var args = bundlerTools.createBundle.args[0];
            args[2].should.equal('hello');
        });

        it('should call addPlugins for each config given', function() {
            config.apps = {
                hello: {
                    entry: 'hello.js'
                }
            };

            sandbox.spy(bundlerTools, 'addPlugins');

            var bundles = createBuilder(config).getBundles();
            var hello = bundles[0];
            bundlerTools.addPlugins.should.have.been.calledOnce;
            bundlerTools.addPlugins.should.have.been.calledWith(hello.bundle, config);
        });

        it('should call addTransforms for each config given', function() {
            config.apps = {
                hello: {
                    entry: 'hello.js'
                }
            };

            sandbox.spy(bundlerTools, 'addTransforms');

            var bundles = createBuilder(config).getBundles();
            var hello = bundles[0];
            bundlerTools.addTransforms.should.have.been.calledOnce;
            bundlerTools.addTransforms.should.have.been.calledWith(hello.bundle, config);
        });

        describe('addFilesToBundle', function() {
            beforeEach(function() {
                sandbox.spy(bundlerTools, 'configureAppBundle');
                sandbox.spy(bundlerTools, 'configureSharedBundle');
            });

            it('should call configureAppBundle for each app config given', function() {
                config.apps = {
                    hello: {
                        entry: 'hello.js'
                    }
                };

                var bundles = createBuilder(config).getBundles();
                var hello = bundles[0];
                bundlerTools.configureAppBundle.should.have.been.calledOnce;
                bundlerTools.configureAppBundle.should.have.been.calledWith(hello.bundle, hello.entry, []);
            });

            it('should call configureAppBundle with any excludes provided', function() {
                config.apps = {
                    hello: {
                        entry: 'hello.js',
                        exclude: ['foo', 'bar']
                    }
                };

                var bundles = createBuilder(config).getBundles();
                var hello = bundles[0];
                bundlerTools.configureAppBundle.should.have.been.calledOnce;

                var args = bundlerTools.configureAppBundle.args[0];
                args[2].should.eql(['foo', 'bar']);
            });

            it('should call configureAppBundle with shared modules excluded by default', function() {
                config.apps = {
                    hello: {
                        entry: 'hello.js'
                    }
                };

                config.shared = {
                    world: {
                        include: ['foo']
                    },
                    other: {
                        include: ['bar']
                    }
                };

                var bundles = createBuilder(config).getBundles();
                var hello = bundles[0];
                bundlerTools.configureAppBundle.should.have.been.calledOnce;

                var args = bundlerTools.configureAppBundle.args[0];
                args[2].should.eql(['foo', 'bar']);
            });

            it('should call configureAppBundle with the exclude option given preference over shared modules', function() {
                config.apps = {
                    hello: {
                        entry: 'hello.js',
                        exclude: ['foo']
                    }
                };

                config.shared = {
                    world: {
                        include: ['bar']
                    }
                };

                var bundles = createBuilder(config).getBundles();
                var hello = bundles[0];
                bundlerTools.configureAppBundle.should.have.been.calledOnce;

                var args = bundlerTools.configureAppBundle.args[0];
                args[2].should.eql(['foo']);
            });

            it('should call configureSharedBundle for each shared config given', function() {
                config.shared = {
                    hello: {
                        entry: 'hello.js',
                        include: ['foo'],
                        exclude: ['bar']
                    }
                };

                var bundles = createBuilder(config).getBundles();
                var hello = bundles[0];
                bundlerTools.configureSharedBundle.should.have.been.calledOnce;
                bundlerTools.configureSharedBundle.should.have.been.calledWith(hello.bundle, hello.include, hello.exclude, hello.entry);
            });
        });

        describe('setBundlePath', function() {
            it('should set the bundle path', function() {
                config.apps = {
                    hello: {
                        entry: 'hello.js'
                    }
                };

                var bundles = createBuilder(config).getBundles();
                var hello = bundles[0];
                hello.path.should.equal('hello.js');
            });

            it('should set the bundle path based on outputFilePattern', function() {
                var testCases = [
                    ['world.js', 'world.js'],
                    ['[name]-world.js', 'hello-world.js'],
                    ['foo-[name].js', 'foo-hello.js']
                ];

                testCases.forEach(function(testCase) {
                    config.apps = {
                        hello: {
                            entry: 'hello.js'
                        }
                    };

                    config.outputFilePattern = testCase[0];

                    var bundles = createBuilder(config).getBundles();
                    var hello = bundles[0];
                    hello.path.should.equal(testCase[1]);
                });
            });

            it('should set the bundle path to the given config path if provided', function() {
                config.apps = {
                    hello: {
                        entry: 'hello.js',
                        path: 'foobar.js'
                    }
                };

                config.outputFilePattern = '[name]-world.js';

                var bundles = createBuilder(config).getBundles();
                var hello = bundles[0];
                hello.path.should.equal('foobar.js');
            });
        });

        it('should add uglify options to the bundle if provided', function() {
            config.apps = {
                hello: {
                    entry: 'hello.js'
                }
            };

            config.uglify = { foo: 'bar' };

            var bundles = createBuilder(config).getBundles();
            var hello = bundles[0];
            hello.uglify.should.eql(config.uglify);
        });
    });
});