"use strict";
var chai = require('chai');
var ddescribeIit = require('../');
var expect = chai.expect;
var File = require('vinyl');

describe('gulp-ddescribe-iit', function() {
  var test, stream;
  beforeEach(function() { test = this.test; });

  function step(fn) {
    return function() {
      stream.domain = test;
      var args = [];
      for (var i = 0; i < arguments.length; ++i) args.push(arguments[i]);
      fn.apply(this, args);
      stream.domain = null;
    }
  }

  function simplifyError(err) {
    return err.raw.map(function(e) {
      return {
        file: e.file,
        line: e.line,
        column: e.column,
        str: e.str
      };
    });
  }

  it('should report multiple errors in same file', function(done) {
    var mockFile = new File({
      path: 'mock-file.js',
      contents: new Buffer('iit();\nddescribe();\nfit();\nfdescribe();')
    });

    stream = ddescribeIit({ noColor: true });
    var called = false;
    stream.once('error', step(function(err) {
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
      expect(err.raw.length).to.eql(4);
      expect(simplifyError(err)).to.deep.equal([
        {
          file: 'mock-file.js',
          line: 1,
          column: 1,
          str: 'iit'
        },
        {
          file: 'mock-file.js',
          line: 2,
          column: 1,
          str: 'ddescribe'
        },
        {
          file: 'mock-file.js',
          line: 3,
          column: 1,
          str: 'fit'
        },
        {
          file: 'mock-file.js',
          line: 4,
          column: 1,
          str: 'fdescribe'
        }
      ]);
    }));
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

    stream = ddescribeIit();

    var called = false;
    stream.once('error', step(function(err) {
      called = true;
      expect(err.raw.length).to.eql(2);
        expect(simplifyError(err)).to.deep.equal([
        {
          file: 'mock-file1.js',
          line: 1,
          column: 1,
          str: 'iit'
        },
        {
          file: 'mock-file2.js',
          line: 1,
          column: 1,
          str: 'ddescribe'
        }
      ]);
    }));
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

    stream = ddescribeIit();

    var called = false;
    stream.once('error', step(function(err) {
      called = true;
    }));
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

    stream = ddescribeIit({ allowDisabledTests: false });

    var called = false;
    stream.once('error', step(function(err) {
      called = true;
      expect(err.raw.length).to.eql(2);
    }));
    stream.once('finish', function() {
      expect(called).to.eql(true);
      done();
    });

    stream.end(mockFile);
  });


  it('should render path of file relative to `basePath` if specified', function(done) {
    var mockFile = new File({
      path: '/foo/bar/baz.js',
      contents: new Buffer('it.only();')
    });
    stream = ddescribeIit({ basePath: '/foo/bar/' });
    var called = false;
    stream.once('error', step(function(err) {
      called = true;
      expect(err.raw.length).to.eql(1);
      expect(err.raw[0].file).to.eql('baz.js');
    }));
    stream.once('finish', function() {
      expect(called).to.eql(true);
      done();
    });
    stream.end(mockFile);
  });


  it('should render unmodified path of file if `basePath` falsy', function(done) {
    var mockFile = new File({
      path: '/foo/bar/baz.js',
      contents: new Buffer('describe.only();')
    });
    stream = ddescribeIit({ basePath: null });
    var called = false;
    stream.once('error', step(function(err) {
      called = true;
      expect(err.raw.length).to.eql(1);
      expect(err.raw[0].file).to.eql('/foo/bar/baz.js');
    }));
    stream.once('finish', function() {
      expect(called).to.eql(true);
      done();
    });
    stream.end(mockFile);
  });


  it('should not render `raw` error list in PluginError', function(done) {
    var mockFile = new File({
      path: '/foo/bar/baz.js',
      contents: new Buffer('describe.only();')
    });
    stream = ddescribeIit();
    var called = false;
    stream.once('error', step(function(err) {
      called = true;
      expect(err.toString()).not.to.include('Details:');
    }));
    stream.once('finish', function() {
      expect(called).to.eql(true);
      done();
    });
    stream.end(mockFile);
  });


  it('should render context for tab-indented files nicely (default tabWidth=4)', function(done) {
    var mockFile = new File({
      path: 'mock-file.js',
      contents: new Buffer('random_stuff();\n\t\tdescribe.only();\n' +
                           '\t\tif(true) {\n\t\t\tbloop();\n\t\t}\n')
    });
    stream = ddescribeIit({ noColor: true });
    var called = false;
    stream.once('error', step(function(err) {
      called = true;
      expect(err.message).to.eql([
          "",
          "Found `describe.only` in mock-file.js:2:3",
          " 1| random_stuff();",
          " 2|         describe.only();",
          "  |         ^^^^^^^^^^^^^",
          " 3|         if(true) {",
          ""
        ].join("\n"));
    }));
    stream.once('finish', function() {
      expect(called).to.eql(true);
      done();
    });
    stream.end(mockFile);
  });


  it('should render context for tab-indented files nicely (tabWidth=2)', function(done) {
    var mockFile = new File({
      path: 'mock-file.js',
      contents: new Buffer('random_stuff();\n\t\tdescribe.only();\n' +
                           '\t\tif(true) {\n\t\t\tbloop();\n\t\t}\n')
    });
    stream = ddescribeIit({ noColor: true, tabWidth: 2 });
    var called = false;
    stream.once('error', step(function(err) {
      called = true;
      expect(err.message).to.eql([
          "",
          "Found `describe.only` in mock-file.js:2:3",
          " 1| random_stuff();",
          " 2|     describe.only();",
          "  |     ^^^^^^^^^^^^^",
          " 3|     if(true) {",
          ""
        ].join("\n"));
    }));
    stream.once('finish', function() {
      expect(called).to.eql(true);
      done();
    });
    stream.end(mockFile);
  });


  it('should render context for tab-indented files nicely (tabWidth=<2)', function(done) {
    var mockFile = new File({
      path: 'mock-file.js',
      contents: new Buffer('random_stuff();\n\t\tdescribe.only();\n' +
                           '\t\tif(true) {\n\t\t\tbloop();\n\t\t}\n')
    });
    stream = ddescribeIit({ noColor: true, tabWidth: -100 });
    var called = false;
    stream.once('error', step(function(err) {
      called = true;
      expect(err.message).to.eql([
          "",
          "Found `describe.only` in mock-file.js:2:3",
          " 1| random_stuff();",
          " 2|     describe.only();",
          "  |     ^^^^^^^^^^^^^",
          " 3|     if(true) {",
          ""
        ].join("\n"));
    }));
    stream.once('finish', function() {
      expect(called).to.eql(true);
      done();
    });
    stream.end(mockFile);
  });


  it('should render context for tab-indented files nicely (tabWidth=>8)', function(done) {
    var mockFile = new File({
      path: 'mock-file.js',
      contents: new Buffer('random_stuff();\n\t\tdescribe.only();\n' +
                           '\t\tif(true) {\n\t\t\tbloop();\n\t\t}\n')
    });
    stream = ddescribeIit({ noColor: true, tabWidth: 100 });
    var called = false;
    stream.once('error', step(function(err) {
      called = true;
      expect(err.message).to.eql([
          "",
          "Found `describe.only` in mock-file.js:2:3",
          " 1| random_stuff();",
          " 2|                 describe.only();",
          "  |                 ^^^^^^^^^^^^^",
          " 3|                 if(true) {",
          ""
        ].join("\n"));
    }));
    stream.once('finish', function() {
      expect(called).to.eql(true);
      done();
    });
    stream.end(mockFile);
  });
});
