# node-pdf2img

A nodejs module for converting pdf into image file

## Dependencies
- GraphicsMagick

Note: Windows users, please be sure GraphicsMagick and Ghostscript are installed (see https://stackoverflow.com/questions/18733695/cimg-error-gm-exe-is-not-recognized-as-an-internal-or-external-command/45783910#45783910 for details) - then it works fine on Windows.

## Installation
```
  $ [sudo] npm install pdf2img
```

## Usage

```javascript
var fs      = require('fs');
var path    = require('path');
var pdf2img = require('pdf2img');

var input   = __dirname + '/test.pdf';

pdf2img.setGlobalBaseOptions({
  type: 'png',                                // png or jpg, default jpg
  size: 1024,                                 // default 1024
  density: 600,                               // default 600
  outputdir: __dirname + path.sep + 'output', // output folder, default null (if null given, then it will create folder name same as file name)
  outputname: 'test',                         // output file name, dafault null (if null given, then it will create image name same as input name)
  page: null                                  // convert selected page, default null (if null given, then it will convert all pages)
});

pdf2img.convert(input, function(err, info) {
  if (err) console.log(err)
  else console.log(info);
});

// To provide options specific to a single conversion:
pdf2img.convert(input, {page: 1}, function(err, info) {
  if (err) console.log(err)
  else console.log(info);
});
```

It will return array of splitted and converted image files.

```javascript
{ result: 'success',
  message: 
   [ { page: 1,
       name: 'test_1.jpg',
       size: 17.275,
       path: '/output/test_1.jpg' },
     { page: 2,
       name: 'test_2.jpg',
       size: 24.518,
       path: '/output/test_2.jpg' },
     { page: 3,
       name: 'test_3.jpg',
       size: 24.055,
       path: '/output/test_3.jpg' } ] }
```

## Maintainer
[Fitra Aditya][0]

## License
MIT

[0]: https://github.com/fitraditya
