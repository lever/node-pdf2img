"use strict";

var fs = require('fs');
var gm = require('gm');
var path = require('path');
var async = require('async');

var BASE_OPTIONS = {
  type: 'jpg',
  size: 1024,
  density: 600,
  outputdir: null,
  outputname: null,
  page: null
};

var Pdf2Img = function() {};

var getOptions = function(opts) {
  var options = Object.create(null);
  options.type = opts.type || BASE_OPTIONS.type;
  options.size = opts.size || BASE_OPTIONS.size;
  options.density = opts.density || BASE_OPTIONS.density;
  options.outputdir = opts.outputdir || BASE_OPTIONS.outputdir;
  options.outputname = opts.outputname || BASE_OPTIONS.outputname;
  // Allows resetting to null.
  options.page = BASE_OPTIONS.page;
  if (opts.hasOwnProperty('page')) {
    options.page = opts.page;
  }
  return options;
};

// @deprecated Prefer #setGlobalBaseOptions(opts), as it does the same thing,
//     but with a name that fully reflects what it does.
Pdf2Img.prototype.setOptions = function(opts) {
  this.setGlobalBaseOptions(opts);
}

Pdf2Img.prototype.setGlobalBaseOptions = function(opts) {
  BASE_OPTIONS = getOptions(opts);
}

Pdf2Img.prototype.convert = function(input, opts, callbackreturn) {
  if (arguments.length === 2) {
    callbackreturn = opts;
    opts = {};
  }
  var options = getOptions(opts);
  // Make sure it has correct extension
  if (path.extname(path.basename(input)) != '.pdf') {
    return callbackreturn({
      result: 'error',
      message: 'Unsupported file type.'
    });
  }

  // Check if input file exists
  if (!isFileExists(input)) {
    return callbackreturn({
      result: 'error',
      message: 'Input file not found.'
    });
  }

  var stdout = [];
  var output = path.basename(input, path.extname(path.basename(input)));

  // Set output dir
  if (options.outputdir) {
    options.outputdir = options.outputdir + path.sep;
  } else {
    options.outputdir = output + path.sep;
  }

  // Create output dir if it doesn't exists
  if (!isDirExists(options.outputdir)) {
    fs.mkdirSync(options.outputdir);
  }

  // Set output name
  if (options.outputname) {
    options.outputname = options.outputname;
  } else {
    options.outputname = output;
  }

  async.waterfall([
    // Get pages count
        function (callback) {
             gm(input).identify("%p ", function (err, value) {
                var pageCount = String(value).split(' ');

                if (!pageCount.length) {
                    callback({
                        result: 'error',
                        message: 'Invalid page number.'
                    }, null);
                } else {
                    // Convert selected page
                    if (options.page !== null) {
                        if (options.page <= pageCount.length) {
                            callback(null, [options.page]);
                        } else {
                            callback({
                                result: 'error',
                                message: 'Invalid page number.'
                            }, null);
                        }
                    } else  {
                        callback(null, pageCount);
                    }
                }

            })

        },


    // Convert pdf file
    function(pages, callback) {
      // Use eachSeries to make sure that conversion has done page by page
      async.eachSeries(pages, function(page, callbackmap) {
        var inputStream = fs.createReadStream(input);
        var outputFile = options.outputdir + options.outputname + '_' + page + '.' + options.type;

        convertPdf2Img(inputStream, outputFile, parseInt(page), options, function(error, result) {
          if (error) {
            return callbackmap(error);
          }

          stdout.push(result);
          return callbackmap(error, result);
        });
      }, function(e) {
        if (e) {
          return callback(e);
        }

        return callback(null, {
          result: 'success',
          message: stdout
        });
      });
    }
  ], callbackreturn);
};

var convertPdf2Img = function(input, output, page, options, callback) {
  if (input.path) {
    var filepath = input.path;
  } else {
    return callback({
      result: 'error',
      message: 'Invalid input file path.'
    }, null);
  }

  var filename = filepath + '[' + (page - 1) + ']';

  gm(input, filename)
    .density(options.density, options.density)
    .resize(options.size)
    .quality(100)
    .write(output, function(err) {
      if (err) {
        return callback({
          result: 'error',
          message: 'Can not write output file.'
        }, null);
      }

      if (!(fs.statSync(output)['size'] / 1000)) {
        return callback({
          result: 'error',
          message: 'Zero sized output image detected.'
        }, null);
      }

      var results = {
        page: page,
        name: path.basename(output),
        size: fs.statSync(output)['size'] / 1000.0,
        path: output
      };

      return callback(null, results);
    });
};

// Check if directory is exists
var isDirExists = function(path) {
  try {
    return fs.statSync(path).isDirectory();
  } catch (e) {
    return false;
  }
}

// Check if file is exists
var isFileExists = function(path) {
  try {
    return fs.statSync(path).isFile();
  } catch (e) {
    return false;
  }
}

module.exports = new Pdf2Img;
