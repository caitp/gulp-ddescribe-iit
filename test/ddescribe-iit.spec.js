var chai = require('chai');
var ddescribeIit = require('../');
var expect = chai.expect;
var File = require('vinyl');

describe('gulp-ddescribe-iit', function() {
  it('should report multiple errors in same file', function(done) {
    var mockFile = new File({
      path: 'mock-file.js',
      contents: new Buffer('iit();\nddescribe();\nfit();\nfdescribe();')
    });

    var stream = ddescribeIit({ noColor: true });

    var called = false;
    stream.once('error', function(err) {
      called = true;
      expect(err.message).to.equal([
        "",
        "Found `iit` in mock-file.js:1:1",
        " 1| iit();",
        "  | ^^^",
        " 2| ddescribe();",
        "",
        "",
        "Found `ddescribe` in mock-file.js:2:1",
        " 1| iit();",
        " 2| ddescribe();",
        "  | ^^^^^^^^^",
        " 3| fit();",
        "",
        "",
        "Found `fit` in mock-file.js:3:1",
        " 2| ddescribe();",
        " 3| fit();",
        "  | ^^^",
        " 4| fdescribe();",
        "",
        "",
        "Found `fdescribe` in mock-file.js:4:1",
        " 3| fit();",
        " 4| fdescribe();",
        "  | ^^^^^^^^^",
        ""
      ].join("\n"));
      var errors = err.message.split('\n\n');
      expect(errors.length).to.eql(4);
    });
    stream.once('finish', function() {
      expect(called).to.eql(true);
      done();
    });

    stream.end(mockFile);
  });


  it('should report multiple errors in different files', function(done) {
    var mockFile1 = new File({
      path: 'mock-file1.js',
      contents: new Buffer('iit();')
    });
    var mockFile2 = new File({
      path: 'mock-file2.js',
      contents: new Buffer('ddescribe();')
    });

    var stream = ddescribeIit();

    var called = false;
    stream.once('error', function(err) {
      called = true;
      var errors = err.message.split('\n\n');
      expect(errors.length).to.eql(2);
    });
    stream.once('finish', function() {
      expect(called).to.eql(true);
      done();
    });

    stream.write(mockFile1);
    stream.end(mockFile2);
  });


  it('should not report xit/xdescribe as errors by default', function(done) {
    var mockFile = new File({
      path: 'mock-file.js',
      contents: new Buffer('xit();\nxdescribe();')
    });

    var stream = ddescribeIit();

    var called = false;
    stream.once('error', function(err) {
      called = true;
    });
    stream.once('finish', function() {
      expect(called).to.eql(false);
      done();
    });

    stream.end(mockFile);
  });


  it('should not report xit/xdescribe as errors when `allowDisabledTests` is false', function(done) {
    var mockFile = new File({
      path: 'mock-file.js',
      contents: new Buffer('xit();\nxdescribe();')
    });

    var stream = ddescribeIit({ allowDisabledTests: false });

    var called = false;
    stream.once('error', function(err) {
      called = true;
      var errors = err.message.split('\n\n');
      expect(errors.length).to.eql(2);
    });
    stream.once('finish', function() {
      expect(called).to.eql(true);
      done();
    });

    stream.end(mockFile);
  });
});
