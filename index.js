var through = require('through');
var path = require('path');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;
var Buffer = require('buffer').Buffer;
var Concat = require('concat-with-sourcemaps'); //!!!

module.exports = function(file, opt) {
  if (!file) throw new PluginError('gulp-md-gen', 'Missing file option for gulp-md-gen');
  if (!opt) opt = {};
  // to preserve existing |undefined| behaviour and to introduce |newLine: ""| for binaries
  if (typeof opt.newLine !== 'string') opt.newLine = gutil.linefeed;

  var firstFile = null;

  var fileName = file;
  if (typeof file !== 'string') {
    if (typeof file.path !== 'string') {
      throw new PluginError('gulp-md-gen', 'Missing path in file options for gulp-md-gen');
    }
    fileName = path.basename(file.path);
    firstFile = new File(file);
  }

  var concat = new Concat(false, fileName, opt.newLine);

  function bufferContents(file) {
    if (file.isNull()) return; // ignore
    if (file.isStream()) return this.emit('error', new PluginError('gulp-md-gen', 'Streaming not supported'));

    console.log(file.relative);


    if (!firstFile) firstFile = file;

    concat.add(file.relative, file.contents.toString());
  }

  function endStream() {
    if (firstFile) {
      var joinedFile = firstFile;

      if (typeof file === 'string') {
        joinedFile = firstFile.clone({contents: false});
        joinedFile.path = path.join(firstFile.base, file);
      }

      joinedFile.contents = new Buffer(concat.content);

      if (concat.sourceMapping)
        joinedFile.sourceMap = JSON.parse(concat.sourceMap);



      this.emit('data', joinedFile);
    }


    console.log(this);

    this.emit('end');
  }

  return through(bufferContents, endStream);
};
