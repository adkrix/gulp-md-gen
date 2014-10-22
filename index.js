var through = require('through');
var path = require('path');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var Buffer = require('buffer').Buffer;

module.exports = function(file, opt) {
  if (!file) throw new PluginError('gulp-md-gen', 'Missing file option for gulp-md-gen');
  if (!opt) opt = {};
  // to preserve existing |undefined| behaviour and to introduce |newLine: ""| for binaries
  if (typeof opt.newLine !== 'string') opt.newLine = gutil.linefeed;

  var fileName = file;
  if (typeof file !== 'string') {
    if (typeof file.path !== 'string') {
      throw new PluginError('gulp-md-gen', 'Missing path in file options for gulp-md-gen');
    }
    fileName = path.basename(file.path);
  }

  var title = opt.title ? opt.title :  "Documentation"
  var content = "";
  var content_list = title + "\n======\n";
  var old_section = ''

  function bufferContents(file) {
    if (file.isNull()) return; // ignore
    if (file.isStream()) return this.emit('error', new PluginError('gulp-md-gen', 'Streaming not supported'));

    var remove_ext = gutil.replaceExtension(file.relative, '');
    var anchore = remove_ext.replace(/[\/\\\.]/g,'_').toLowerCase();
    var title = file.contents.toString().replace(/^\s+/, '').split("\n")[0].replace(/^#+\s+/,'')
    var section = path.dirname(file.relative)

    content_list += "* [" + section + ": " + title + "](#" + anchore + ")\n";

    if(old_section != section)
    {
      old_section = section;
      content += "\n"+section+"\n------";
    }
    content += "\n<a name=\"" + anchore + "\"></a>";
    content += "\n" + file.contents.toString();
  }

  function endStream() {
    var file = new gutil.File({
      path: fileName,
      contents: new Buffer(content_list + content)
    });
    this.emit('data', file);
    this.emit('end');
  }

  return through(bufferContents, endStream);
};
