"use strict";

var fs      = require('fs');
var path    = require('path');
var expect  = require('chai').expect();
var should  = require('chai').should();
var pdf2img = require('../index.js');

var input   = __dirname + path.sep + 'test.pdf';
var onePageInput = __dirname + path.sep + 'one_page.pdf';

pdf2img.setGlobalBaseOptions({
  outputdir: __dirname + path.sep + '/output',
  outputname: 'test'
});

describe('Split and convert pdf into images', function() {
  it ('Handle bad input', function(done) {
    this.timeout(100000);
    var opts = { type: 'jpg', page: null};
    var error = {result: 'error', message: 'Unsupported file type.'};
    convertFileAndAssertError('asdf', opts, error, done);
  });
  it ('Handle file does not exist', function(done) {
    this.timeout(100000);
    var opts = { type: 'jpg', page: null};
    var error = {result: 'error', message: 'Input file not found.'};
    convertFileAndAssertError('asdf.pdf', opts, error, done);
  });
  it ('Create jpg files', function(done) {
    this.timeout(100000);
    pdf2img.convert(input, function(err, info) {
      if (info.result !== 'success') {
        info.result.should.equal('success');
        done();
      } else {
        var n = 1;
        info.message.forEach(function(file) {
          file.page.should.equal(n);
          file.name.should.equal('test_' + n + '.jpg');
          isFileExists(file.path).should.to.be.true;
          if (n === 3) done();
          n++;
        });
      }
    });
  });
  it ('Create png files', function(done) {
    this.timeout(100000);
    var opts = { type: 'png' };
    pdf2img.convert(input, opts, function(err, info) {
      if (info.result !== 'success') {
        info.result.should.equal('success');
        done();
      } else {
        var n = 1;
        info.message.forEach(function(file) {
          file.page.should.equal(n);
          file.name.should.equal('test_' + n + '.png');
          isFileExists(file.path).should.to.be.true;
          if (n === 3) done();
          n++;
        });
      }
    });
  });
  it ('Create jpg file only for given page', function(done) {
    this.timeout(100000);
    var opts = { type: 'jpg', page: 1 };
    convertFileAndAssertExists(input, opts, 1, 'jpg', done);
  });
  it ('Create png file only for given page', function(done) {
    this.timeout(100000);
    var opts = { type: 'png', page: 2 };
    convertFileAndAssertExists(input, opts, 2, 'png', done);
  });
  it ('Create jpg file for one page pdf', function(done) {
    this.timeout(100000);
    var opts = { type: 'jpg', page: null};
    convertFileAndAssertExists(onePageInput, opts, 1, 'jpg', done);
  });
  it ('Create jpg file for one page pdf when specifying', function(done) {
    this.timeout(100000);
    var opts = { type: 'jpg', page: 1 };
    convertFileAndAssertExists(onePageInput, opts, 1, 'jpg', done);
  });
  it ('The timeout parameter will end conversion', function(done) {
    this.timeout(100000);
    var milliseconds = 10;
    var opts = {timeoutMilliseconds: milliseconds};
    var error = {
      result: 'timeout',
      message: 'gm identify call took longer than ' + milliseconds + 'ms.'
    };
    // First induce a timeout error.
    convertFileAndAssertError(onePageInput, opts, error, function(err) {
      // Then convert again to confirm there were no side effects.
      convertFileAndAssertExists(onePageInput, {}, 1, 'jpg', done);
    });
  });
});

var convertFileAndAssertError = function (path, options, error, callback) {
  pdf2img.convert(path, options, function(err) {
    if (err) {
      err.result.should.equal(error.result);
      err.message.should.equal(error.message);
    } else {
      return callback('Conversion should not have succeeded.')
    }
    callback();
  });
};

var convertFileAndAssertExists = function (path, options, pageNumber, extension, callback) {
  pdf2img.convert(path, options, function(err, info) {
    if (err) {
      console.log("Error: ", err);
      throw err;
    }
    if (info.result !== 'success') {
      info.result.should.equal('success');
      callback();
    } else {
      info.message.length.should.equal(1);
      var file = info.message[0];
      file.page.should.equal(pageNumber);
      file.name.should.equal('test_' + pageNumber + '.' + extension);
      isFileExists(file.path).should.to.be.true;
      callback();
    }
  });
};

var isFileExists = function(path) {
  try {
    return fs.statSync(path).isFile();
  } catch (e) {
    return false;
  }
}
