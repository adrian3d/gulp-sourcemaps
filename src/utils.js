'use strict';
var path = require('path');
var detectNewline = require('detect-newline');

function unixStylePath(filePath) {
  return filePath.split(path.sep).join('/');
}

var PLUGIN_NAME = require('../package.json').name;

var urlRegex = /^(https?|webpack(-[^:]+)?):\/\//;

var debug = require('./debug').spawn('utils');
/*
So reusing the same ref for a regex (with global (g)) is from a poor decision in js.
See http://stackoverflow.com/questions/10229144/bug-with-regexp-in-javascript-when-do-global-search

So we either need to use a new instance of a regex everywhere.
*/
function sourceMapUrlRegEx() {
  return /\/\/\# sourceMappingURL\=.*/g;
}

var commentFormatters = {
  css: function cssCommentFormatter(preLine, newline, url) {
    return preLine + '/*# sourceMappingURL=' + url + ' */' + newline;
  },
  js: function jsCommentFormatter(preLine, newline, url) {
    return preLine + '//# sourceMappingURL=' + url + newline;
  },
  default: function defaultFormatter() {
    return '';
  },
};

function getCommentFormatter(file) {
  var extension = file.relative.split('.').pop();
  var fileContents = file.contents.toString();
  var newline = detectNewline.graceful(fileContents || '');

  var commentFormatter = commentFormatters.default;

  if (file.sourceMap.preExistingComment) {
    commentFormatter = (commentFormatters[extension] || commentFormatter).bind(undefined, '', newline);
    debug(function() {
      return 'preExistingComment commentFormatter ' + commentFormatter.name;
    });
  } else {
    commentFormatter = (commentFormatters[extension] || commentFormatter).bind(undefined, newline, newline);
  }

  debug(function() {
    return 'commentFormatter ' + commentFormatter.name;
  });
  return commentFormatter;
}

function getInlinePreExisting(fileContent) {
  if (sourceMapUrlRegEx().test(fileContent)) {
    debug(function() { return 'has preExisting'; });
    return fileContent.match(sourceMapUrlRegEx())[0];
  }
}

function exceptionToString(exception) {
  return exception.message || '';
}

module.exports = {
  unixStylePath: unixStylePath,
  PLUGIN_NAME: PLUGIN_NAME,
  urlRegex: urlRegex,
  sourceMapUrlRegEx: sourceMapUrlRegEx,
  getCommentFormatter: getCommentFormatter,
  getInlinePreExisting: getInlinePreExisting,
  exceptionToString: exceptionToString,
};
