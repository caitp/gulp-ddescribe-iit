var through2 = require('through2');
var PluginError = require('gulp-util').PluginError;

module.exports = ddescribeIit;
function ddescribeIit(opt) {
  var supports_colors = (function() {
    if (process.argv.indexOf('--no-color') !== -1) return false;
    if (process.stdout && !process.stdout.isTTY) return false;
    if (process.platform === 'win32') return true;
    if ('COLORTERM' in process.env) return true;
    if (process.env.TERM === 'dumb') return false;
    if (/^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) return true;
    return false;
  })();

  var colors = {
    red: {
      open: supports_colors ? '\u001b[' + 31 + 'm' : '',
      close: supports_colors ? '\u001b[' + 39 + 'm' : ''
    },
    gray: {
      open: supports_colors ? '\u001b[' + 90 + 'm' : '',
      close: supports_colors ? '\u001b[' + 39 + 'm' : ''
    }
  };

  opt = opt || { allowDisabledTests: true };

  function getOrDefault(o, key, def) {
    var val = o[key];
    if (val === void 0) val = def;
    return val;
  }

  var allowDisabledTests = getOrDefault(opt, 'allowDisabledTests', true);

  var BAD_FUNCTIONS = [
    // jasmine / minijasminenode / angular
    'iit',
    'ddescribe',

    // jasmine 2.0 "focused" specs
    'fit',
    'fdescribe',

    // mocha
    'it.only',
    'describe.only',
  ];

  var DISABLED_TEST_FUNCTIONS = [
    // jasmine / minijasminenode / angular
    'xit',
    'xdescribe',

    // TODO(@caitp): support mocha `skip()` api?
  ];

  if (!allowDisabledTests) {
    BAD_FUNCTIONS = BAD_FUNCTIONS.concat(DISABLED_TEST_FUNCTIONS);
  }

  function makeErrorContext(lines, lineNo, column, word) {
    var before = lineNo > 1 ? lines[lineNo - 2] : null;
    var after = lineNo < lines.length ? lines[lineNo] : null;
    var current = lines[lineNo - 1];

    var result = '';
    if (before !== null) result += (normalize(lines.length, lineNo - 1) + before + '\n');
    result += (normalize(lines.length, lineNo) + current + '\n');
    result += (normalize(lines.length, lineNo, true) + underline(column - 1, word.length) + '\n');
    if (after !== null) result += (normalize(lines.length, lineNo + 1) + after + '\n');

    return result;

    function normalize(total, num, blank) {
      var needed = ' ' + total.toString(10);
      if (blank) {
        num = ' ';
        while (num.length < needed.length) num += ' ';
      } else {
        num = num.toString(10);
        while (num.length < needed.length) num = ' ' + num;
      }
      return gray(num + '| ');
    }

    function underline(offset, length) {
      var s = '';
      while (s.length < offset) s += ' ';
      var u = '';
      while (u.length < length) u += '^';
      return s + red(u);
    }
  }

  var BAD_FUNCTIONS_SRC = BAD_FUNCTIONS.map(function(fn) {
    return '(?:' + fn.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + ')';
  }).join('|');
  var regexp = new RegExp('(^|\\s)(' + BAD_FUNCTIONS_SRC + ')\\s*\\(', 'm');

  var errors = [];
  return through2.obj(function processFile(file, enc, cb) {
    if (file.isNull()) return cb(null, file);
    if (file.isStream()) return cb(new PluginError('gulp-ddescribe-iit', 'Streaming not supported'));

    var path = file.path;
    var contents = file.contents.toString();
    var originalContents = contents;
    var lines = originalContents.split('\n');
    var start = 0;
    var lineStarts = lines.map(function(line) {
      var l = start;
      start += line.length;
      return l;
    });
    var pos = 0;
    var match;
    while (match = regexp.exec(contents)) {
      var index = pos + match.index + match[1].length;
      pos = index + match[2].length - 1;
      contents = contents.slice(match.index + match[1].length + match[2].length);

      // Location of error
      var lineNo = originalContents.substr(0, pos).split('\n').length;
      var lineStart = lineStarts[lineNo - 1];
      var column = max(1, index - lineStart);

      errors.push({
        file: file.path,
        str: match[2],
        line: lineNo,
        column: column,
        context: makeErrorContext(lines, lineNo, column, match[2])
      });
    }
    cb();
  }, function flushStream(cb) {
    if (errors.length) {
      this.emit('error', new PluginError('ddescribe-iit', {
        message: '\n' + errors.map(function(error) {
          return 'Found `' + error.str + '` in ' + error.file + ':' + error.line + ':' + error.column + '\n' +
                 error.context;
        }).join('\n\n'),
        showStack: false
      }));
      cb();
    }
  });

  // Stylize that output :D
  function max(a, b) {
    return a > b ? a : b;
  }

  function gray(str) {
    return colorize('gray', str);
  }

  function red(str) {
    return colorize('red', str);
  }

  function colorize(code, str) {
    var c = colors[code];
    if (!c) return str;
    return '' + c.open + str + c.close;
  }
}
