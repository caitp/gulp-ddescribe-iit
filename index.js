var through2 = require('through2');
var path = require('path');
var PluginError = require('gulp-util').PluginError;

var HEX_DIGITS = '0123456789abcdef'.split('');
var OCTAL_DIGITS = '01234567'.split('');

module.exports = ddescribeIit;
function ddescribeIit(opt) {
  'use strict';
  opt = opt || { allowDisabledTests: true, noColor: false };
  var noColor = getOrDefault(opt, 'noColor', false);
  var supports_colors =  !noColor && /* istanbul ignore next */ (function() {
    // E2E testable, but trivial --- ignored
    if (process.argv.indexOf('--no-color') !== -1) return false;
    if (process.stdout && !process.stdout.isTTY) return false;
    if (process.platform === 'win32') return true;
    if ('COLORTERM' in process.env) return true;
    if (process.env.TERM === 'dumb') return false;
    if (/^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) return true;
    return false;
  })();

  var colors = {
    red: color(31, 39),
    gray: color(90, 39)
  };
  function color(open, close) {
    if (!supports_colors) return null;
    return {
      open: '\u001b[' + open + 'm',
      close: '\u001b[' + close + 'm'
    };
  }

  function getOrDefault(o, key, def) {
    var val = o[key];
    if (val === void 0) val = def;
    return val;
  }

  var allowDisabledTests = getOrDefault(opt, 'allowDisabledTests', true);
  var basePath = getOrDefault(opt, 'basePath', process.cwd());
  var tabWidth = getOrDefault(opt, 'tabWidth', 4);
  if (typeof tabWidth !== 'number') tabWidth = 4;
  if (tabWidth < 2) tabWidth = 2;
  if (tabWidth > 8) tabWidth = 8;
  var tabString = '  ';
  while (tabString.length < tabWidth) tabString += ' ';

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

    // TODO(@caitp): support mocha `this.skip()` api?
  ];

  if (!allowDisabledTests) {
    BAD_FUNCTIONS = BAD_FUNCTIONS.concat(DISABLED_TEST_FUNCTIONS);
  }

  function makeErrorContext(lines, lineNo, column, word, renderColumn) {
    var words = word.split('\n');
    var before = lineNo > 1 ? lines[lineNo - 2] : null;
    var current = lines[lineNo - 1];

    var result = '';
    if (before !== null) result += (normalize(lines.length, lineNo - 1) + before + '\n');
    result += (normalize(lines.length, lineNo) + current + '\n');
    var word0 = words.shift().replace(/\s+$/, '');

    result += (normalize(lines.length, lineNo, true) + underline(renderColumn, word0.length) + '\n');
    while (words.length) {
      var nextLine = lines[lineNo++];
      result += (normalize(lines.length, lineNo) + nextLine + '\n');
      var start = /[^\s]/.exec(words[0]);
      if (start) {
        start = start.index;
        var end = /\s*$/.exec(words[0].slice(start));
        end = end ? end.index : words[0].length;
        result += (normalize(lines.length, lineNo, true) + underline(start, end) + '\n');
      }
      words.shift();
    }
    var after = lineNo < lines.length ? lines[lineNo] : null;
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
    fn = fn.split('.').
      reduce(function joinIdentifiers(current, id) {
        var identifier = transformIdentifier(id);
        if (!current) return identifier;
        var stringKey = transformString(id);
        id =
          // MemberExpression . Identifier
          '(?:\\.\\s*' + identifier + ')|' +
          // MemberExpression [ StringLiteral ]
          '(?:\\[\\s*\"' + stringKey + '\"\\s*\\])|' +
          '(?:\\[\\s*\'' + stringKey + '\'\\s*\\])';
        return current + '\\s*?(?:' + id + ')';
      }, "");
    return '(?:' + fn + ')';

    function transformIdentifier(id) {
      var s = '';
      for (var i = 0; i < id.length; ++i) {
        var c = id.charAt(i);
        var x = toHex4Digits(c);
        // UnicodeEscapeSequence :: u Hex4Digits
        var unicode1 = '\\\\u' + x;
        // UnicodeEscapeSequence :: u { Hex4Digits }
        var unicode2 = '\\\\u\\{0*' + x.slice(2) + '\\}';
        s += '(?:' + c + '|(?:' + unicode1 + ')|(?:' + unicode2 + '))';
      }
      return s;
    }

    function transformString(id) {
      var s = '';
      for (var i = 0; i < id.length; ++i) {
        var c = id.charAt(i);
        var x = toHex4Digits(c);
        var o = toOctal(c);
        // UnicodeEscapeSequence :: u Hex4Digits
        var unicode1 = '\\\\u' + x;
        // UnicodeEscapeSequence :: u { Hex4Digits }
        var unicode2 = '\\\\u\\{0*' + x.slice(2) + '\\}';
        // HexEscapeSequence :: x HexDigit HexDigit
        var hex = '\\\\x' + x.slice(2);
        var octal = '\\\\' + o;
        s += '(?:' + c + '|(?:\\\\' + c + ')|(?:' + unicode1 + ')|(?:' + unicode2 + ')|(?:' + hex + ')|(?:' + octal + '))';
      }
      return s;
    }
    function toHex4Digits(c) {
      var x = '';
      var len = 0;
      c = c.charCodeAt(0);
      
      while (c) {
        var d = HEX_DIGITS[c & 0xF];
        c >>= 4;
        ++len;
        if (/[a-f]/.test(d)) {
          x = '[' + d + d.toUpperCase() + ']' + x;
        } else {
          x = d + x;
        }
      }
      if (len === 1) x = '000' + x;
      else if (len === 2) x = '00' + x;
      // TODO(@caitp): Add support for > 8bit codepoints if ever needed
      return x;
    }

    function toOctal(c) {
      var o = '';
      var len = 0;
      c = c.charCodeAt(0);
      while (c) {
        o = OCTAL_DIGITS[c & 0x7] + o;
        len++;
        c >>= 3;
      }
      return o;
    }
  }).join('|');
  var regexp = new RegExp('(^|\\s)(' + BAD_FUNCTIONS_SRC + ')\\s*\\(', 'm');
  var errors = [];
  return through2.obj(function processFile(file, enc, cb) {
    if (file.isNull()) return cb(null, file);
    if (file.isStream()) return cb(new PluginError('gulp-ddescribe-iit', 'Streaming not supported'));

    var path = file.path;
    var contents = file.contents.toString();
    var originalContents = contents;
    var renderContents = originalContents.replace(/\t/g, tabString);
    var lines = originalContents.split('\n');
    var renderLines = renderContents.split('\n');
    var start = 0;
    var lineStarts = lines.map(lineStartMapper);
    start = 0;
    var renderLineStarts = renderLines.map(lineStartMapper);
    function lineStartMapper(line) {
      var l = start;
      start += (line.length + 1);
      return l;
    }
    var pos = 0;
    var renderPos = 0;
    var match;
    while (match = regexp.exec(contents)) {
      var renderMatch = regexp.exec(renderContents);
      var index = pos + match.index + match[1].length;
      var renderIndex = renderPos + renderMatch.index + renderMatch[1].length;
      var wordLines = match[2].split('\n').length;
      if (wordLines > 1) {
        pos = index + match[2].split('\n').join(' ').length;
        renderPos = renderIndex + renderMatch[2].split('\n').join(' ').length;
      } else {
        pos = index + match[2].length;
        renderPos = renderIndex + renderMatch[2].length;
      }
      contents = contents.slice(match.index + match[1].length + match[2].length);
      renderContents = renderContents.slice(renderMatch.index + renderMatch[1].length +
                                            renderMatch[2].length);

      // Location of error
      var lineNo = originalContents.substr(0, pos).split('\n').length;
      if (wordLines > 1) lineNo -= wordLines - 1;
      var lineStart = lineStarts[lineNo - 1];
      var renderLineStart = renderLineStarts[lineNo - 1];
      var column = max(1, (index - lineStart) + 1);
      var renderColumn = max(0, (renderIndex - renderLineStart));

      var word = match[2].replace(/\t/g, tabString);
      errors.push({
        file: toRelativePath(basePath, file.path),
        str: simplifyString(match[2]),
        line: lineNo,
        column: column,
        context: makeErrorContext(renderLines, lineNo, column, word, renderColumn)
      });
    }
    cb();
  }, function flushStream(cb) {
    if (errors.length) {
      var error = new PluginError('gulp-ddescribe-iit', {
        message: '\n' + errors.map(function(error) {
          return 'Found `' + error.str + '` in ' +
                 error.file + ':' + error.line + ':' + error.column + '\n' +
                 error.context;
        }).join('\n\n'),
        showStack: false,
        showProperties: false
      });
      error.raw = errors;
      this.emit('error', error);
      cb();
    }
  });

  function simplifyString(str) {
    return str.
              replace(/\s+/g, '').
              replace(/(\\u([0-9a-fA-F]{4}))/g, replaceHex).
              replace(/(\\u\{([0-9a-fA-F]+)\})/g, replaceHex).
              replace(/(\\x([0-9a-fA-F]{2}))/g, replaceHex).
              replace(/(\\([0-7]{1,3}))/g, replaceOctal).
              replace(/(\\(.))/g, function($0, $1, $2) {
                return $2;
              });

    function replaceHex($0, $1, $2) {
      return String.fromCharCode(parseInt($2, 16));
    }

    function replaceOctal($0, $1, $2) {
      return String.fromCharCode(parseInt($2, 8));
    }
  }

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

  function toRelativePath(basePath, filePath) {
    if (!basePath) return filePath;
    return path.relative(basePath, filePath);
  }
}
