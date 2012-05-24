var chai = require('chai')
  , should = chai.should();

var carbon = require('carbon')
  , carbonStats = require('..')
  , http = require('http');

describe('Carbon Stats', function () {
  var proxy
    , stats
    , http1
    , http2;

  before(function (done) {
    http1 = http.createServer();
    http2 = http.createServer(function (req, res) {
      setTimeout(function () {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('hello universe');
      }, 15);
    });

    stats = carbonStats({
      store: new carbonStats.MemoryStore()
    });

    proxy = carbon.listen(http1);
    proxy.use(stats.middleware());
    proxy.use(function (req, res, next) {
      if (req.url == '/hello') return next(5005);
      next();
    });

    http1.listen(5000, function () {
      http2.listen(5005, done);
    });
  });

  after(function () {
    http1.close();
    http2.close();
  })

  it('can mark on a request', function (done) {
    http.get({
        host: 'localhost'
      , port: 5000
      , path: '/'
    }, function (res) {
      res.on('end', function () {
        stats.store.markTotal('request').should.equal(1);
        stats.store.markTotal('missed').should.equal(1);
        done();
      });
    });
  });

  it('can make a request', function (done) {
    http.get({
        host: 'localhost'
      , port: 5000
      , path: '/hello'
    }, function (res) {
      res.on('end', function () {
        stats.store.markTotal('request').should.equal(2);
        stats.store.markTotal('missed').should.equal(1);
        stats.store.diffTotal('response').should.equal(1);
        stats.store.diffAvg('response').should.be.above(14);
        done();
      });
    });
  });
});
