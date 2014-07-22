'use strict';
var libPath = './../../lib',
  path = require('path'),
  through = require('through2'),
  mergeStream = require('merge-stream'),
  streamBundles = require(libPath + '/stream-bundles.js'),
  should = require('should'),
  gutil = require('gulp-util'),
  helpers = require('../helpers');

describe('stream-bundles', function () {

  var fileCount;

  beforeEach(function () {
    fileCount = 0;
  });

  function verifyStreamBundlesOneFile(config, done, fn) {
    var streams = streamBundles(config);

    (streams.length).should.eql(1);

    mergeStream.apply(null, streams)
      .pipe(through.obj(function (file, enc, cb) {
        if (fn) fn(file);
        fileCount++;
        this.push(file);
        cb();
      }))
      .on('data', function () {
      }) // noop
      .on('end', function () {
        (fileCount).should.eql(1);
        done();
      });

  }

  describe('copy', function () {

    it('should support simple string', function (done) {

      var config = {
        copy: './content/a.js',
        base: path.join(__dirname, '../fixtures')
      };

      verifyStreamBundlesOneFile(config, done, function (file) {
        file.relative.should.eql('content/a.js');
      });

    });

    describe('object notation', function () {
      it('should support src string', function (done) {

        var config = {
          copy: {
            src: './content/a.js'
          },
          base: path.join(__dirname, '../fixtures')
        };

        verifyStreamBundlesOneFile(config, done, function (file) {
          file.relative.should.eql('content/a.js');
        });

      });

      it('should support with base', function (done) {

        var config = {
          copy: {
            src: './content/a.js',
            base: './content'
          },
          base: path.join(__dirname, '../fixtures')
        };

        verifyStreamBundlesOneFile(config, done, function (file) {
          file.relative.should.eql('a.js');
        });

      });
    });

    describe('array notation', function () {
      it('should work with strings', function (done) {

        var config = {
          copy: [
            './content/a.js'
          ],
          base: path.join(__dirname, '../fixtures')
        };

        verifyStreamBundlesOneFile(config, done, function (file) {
          file.relative.should.eql('content/a.js');
        });

      });

      it('should work with objects', function (done) {

        var config = {
          copy: [
            {
              src: './content/a.js'
            }
          ],
          base: path.join(__dirname, '../fixtures')
        };

        verifyStreamBundlesOneFile(config, done, function (file) {
          file.relative.should.eql('content/a.js');
        });

      });

      it('should work with objects with base', function (done) {

        var config = {
          copy: [
            {
              src: './content/a.js',
              base: './content'
            }
          ],
          base: path.join(__dirname, '../fixtures')
        };

        verifyStreamBundlesOneFile(config, done, function (file) {
          file.relative.should.eql('a.js');
        });

      });

      it('should work with objects array src', function (done) {

        var config = {
          copy: [
            {
              src: [
                './content/a.js'
              ]
            }
          ],
          base: path.join(__dirname, '../fixtures')
        };

        verifyStreamBundlesOneFile(config, done, function (file) {
          file.relative.should.eql('content/a.js');
        });

      });

      it('should work with objects with base and array src', function (done) {

        var config = {
          copy: [
            {
              src: [
                './content/a.js'
              ],
              base: './content'
            }
          ],
          base: path.join(__dirname, '../fixtures')
        };

        verifyStreamBundlesOneFile(config, done, function (file) {
          file.relative.should.eql('a.js');
        });

      });

    });

    describe('should error', function () {

      it('when copy is num', function () {

        (function () {
          streamBundles({
            copy: 1
          });
        }).should.throw(gutil.PluginError);

      });

      it('when copy is bool', function () {

        (function () {
          streamBundles({
            copy: true
          });
        }).should.throw(gutil.PluginError);

      });

      it('when copy is array and has invalid value: num', function () {

        (function () {
          streamBundles({
            copy: [
              1
            ]
          });
        }).should.throw(gutil.PluginError);

      });

      it('when copy is array and has invalid value: num', function () {

        (function () {
          streamBundles({
            copy: [
              true
            ]
          });
        }).should.throw(gutil.PluginError);

      });

      it('when copy is array and has invalid value: array', function () {

        (function () {
          streamBundles({
            copy: [
              ['./content/*.js']
            ]
          });
        }).should.throw(gutil.PluginError);

      });

    });

  });

  describe('styles', function () {

    var lines;

    it('should support basic less compilation', function (done) {

      var config = {
        bundle: {
          main: {
            styles: 'content/a.less'
          }
        },
        base: path.join(__dirname, '../fixtures')
      };

      verifyStreamBundlesOneFile(config, done, function (file) {
        file.relative.should.eql('main.css');
        lines = file.contents.toString().split(/\r?\n/);
        helpers.assertStringStartsWithSourceMapCss(lines[lines.length - 1]);
        delete lines[lines.length - 1];
        (lines.join('\n')).should.eql('#header {\n' +
          '  color: #5b83ad;\n' +
          '}\n\n');
      });

    });

    it('should combine less and css together', function (done) {

      var config = {
        bundle: {
          main: {
            styles: [
              'content/a.css',
              'content/a.less'
            ]
          }
        },
        base: path.join(__dirname, '../fixtures')
      };

      verifyStreamBundlesOneFile(config, done, function (file) {
        file.relative.should.eql('main.css');
        lines = file.contents.toString().split(/\r?\n/);
        helpers.assertStringStartsWithSourceMapCss(lines[lines.length - 1]);
        delete lines[lines.length - 1];
        (lines.join('\n')).should.eql(
            'body {\n  background-color: red;\n}\n' +
            '#header {\n  color: #5b83ad;\n}\n\n');
      });

    });

    it('should compile less with @import', function (done) {

      var config = {
        bundle: {
          main: {
            styles: 'content/b.less'
          }
        },
        base: path.join(__dirname, '../fixtures')
      };

      verifyStreamBundlesOneFile(config, done, function (file) {
        file.relative.should.eql('main.css');
        lines = file.contents.toString().split(/\r?\n/);
        helpers.assertStringStartsWithSourceMapCss(lines[lines.length - 1]);
        delete lines[lines.length - 1];
        (lines.join('\n')).should.eql('.link {\n  color: #428bca;\n}\n\n');
      });

    });

  });

});
