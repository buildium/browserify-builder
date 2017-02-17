var chai = require('chai');
var sinon = require('sinon');
chai.should();
chai.use(require('sinon-chai'));

require('../src/create-builder');
require('../src/parallel-runner');

describe('browserify-builder', function() {
    var sandbox,
        browserifyBuilder,
        createBuilder,
        createParallelBuilder;

    before(function() {
        sandbox = sinon.sandbox.create();
        createBuilder = sandbox.stub( require.cache[ require.resolve( '../src/create-builder' ) ], 'exports');
        createParallelBuilder = sandbox.stub( require.cache[ require.resolve( '../src/parallel-runner' ) ], 'exports');
        browserifyBuilder = require('../index');
    });

    beforeEach(function() {
        createBuilder.reset();
        createParallelBuilder.reset();
    });

    after(function() {
        sandbox.restore();
    });

    it('should be a noop if no config is provided', function() {
        browserifyBuilder();
        createBuilder.should.have.not.been.called;
        createParallelBuilder.should.have.not.been.called;
    });

    it('should create a builder', function() {
        var config = {};
        browserifyBuilder(config);
        createBuilder.should.have.been.calledWith(config);
    });

    it('should pass callback to builder if provided', function() {
        var config = {};
        var callback = function() {};
        browserifyBuilder(config, callback);
        createBuilder.should.have.been.calledWith(config, callback);
    });

    it('should create a parallel builder if the parallel is true', function() {
        var config = { parallel: true };
        browserifyBuilder(config);
        createParallelBuilder.should.have.been.calledWith(config);
    });

    it('should not create a parallel builder if watch is true', function() {
        var config = { parallel: true, watch: true };
        browserifyBuilder(config);
        createParallelBuilder.should.not.have.been.called;
    });

    it('should pass callback to parallel builder if provided', function() {
        var config = { parallel: true };
        var callback = function() {};
        browserifyBuilder(config, callback);
        createParallelBuilder.should.have.been.calledWith(config, callback);
    });
});