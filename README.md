gulp-ddescribe--it
==================

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