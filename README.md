gulp-ddescribe-iit
==================

[![Build Status](https://travis-ci.org/caitp/gulp-ddescribe-iit.svg?branch=master)](https://travis-ci.org/caitp/gulp-ddescribe-iit)
[![dependencies](https://img.shields.io/david/caitp/gulp-ddescribe-iit.svg?style=flat)](https://david-dm.org/caitp/gulp-ddescribe-iit)
[![NPM Version](http://img.shields.io/npm/v/gulp-ddescribe-iit.svg)](https://www.npmjs.org/package/gulp-ddescribe-iit)

Based on @btford's [grunt-ddescribe-iit](https://github.com/btford/grunt-ddescribe-iit),
with a gulp and ANSI color makeover.

##Usage

```js
var ddescribeIit = require('gulp-ddescribe-iit');

// I mean, that's basically it --- there isn't much to it.
gulp.src('my-files/**/*.test.js').
    pipe(ddescribeIit({ allowDisabledTests: false }));
```

##Options

| Option                         | Description                            
|--------------------------------|----------------------------------------
| `allowDisabledTests`           | If set to a defined falsy value, will report errors when `xit` or `xdescribe` are used. Defaults to true

##License

MIT License --- See [LICENSE](LICENSE) for details.