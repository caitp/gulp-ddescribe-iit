gulp-ddescribe-iit
==================

[![Build Status](https://travis-ci.org/caitp/gulp-ddescribe-iit.svg?branch=master)](https://travis-ci.org/caitp/gulp-ddescribe-iit)
[![dependencies](https://img.shields.io/david/caitp/gulp-ddescribe-iit.svg?style=flat)](https://david-dm.org/caitp/gulp-ddescribe-iit)
[![NPM Version](http://img.shields.io/npm/v/gulp-ddescribe-iit.svg)](https://www.npmjs.org/package/gulp-ddescribe-iit)

Based on @btford's [grunt-ddescribe-iit](https://github.com/btford/grunt-ddescribe-iit),
with a gulp and ANSI color makeover.

## Hows it look!?

This is super important, I'm glad you asked. I spent a good few minutes trying to make it look decent.

<img width="315" alt="screen shot 2015-07-07 at 10 13 11 pm" src="https://cloud.githubusercontent.com/assets/2294695/8561561/7783a478-24f5-11e5-9f52-c68a89b5371f.png">

## Usage

```js
var ddescribeIit = require('gulp-ddescribe-iit');

// I mean, that's basically it --- there isn't much to it.
gulp.task('ddescribe-iit', function(done) {
  return gulp.src(['modules/**/*.spec.ts', 'modules/**/*_spec.ts']).
     pipe(ddescribeIit({ allowDisabledTests: false }));
});
```

## Options

| Option                         | Description                            
|--------------------------------|----------------------------------------
| `allowDisabledTests`           | If set to a defined falsy value, will report errors when `xit` or `xdescribe` are used. Defaults to true
| `noColor`                      | Defaults to `false` --- If true, disables color output.
| `basePath`                     | Defaults to current working directory --- Used to determine relative path of file. If falsy, uses unmodified path.
| `tabWidth`                     | Defaults to `4` --- Must be a number not less than 2 or greater than 8.

## License

MIT License --- See [LICENSE](LICENSE) for details.
