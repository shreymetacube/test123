"use strict";

//var gulp = require('gulp');
var util = require('util');
var sequence = require('gulp-sequence');

// Require all tasks in gulp/tasks, including subfolders
//var requireDir = require('require-dir');
//requireDir('./tasks', {recurse: true})(config);


/*
 * Need to pass in configuration object and environment
 */
module.exports = function (gulp, config) {
    config.gulp = gulp;
    // Import task index
    require('./tasks/')(config);
    
    var module = {};

    module.test = function () {
        console.log(config.test);
    };
    return module;
};