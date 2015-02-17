// Copyright © 2015 authors, see package.json
//
// all rights reserved

var concat = require('gulp-concat');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var sourcemaps = require('gulp-sourcemaps');
var typescript = require('gulp-typescript');

gulp.task('default', ['script', 'html']);

var SCRIPT_SOURCES = ['src/*.ts', 'src/*.js', 'libopus.js', 'libopus_libspeexdsp.js', 'libspeexdsp.js'];

gulp.task('watch', ['script', 'html'], function() {
    gulp.watch('src/*.html', ['html']);
    gulp.watch(SCRIPT_SOURCES, ['script']);
});

gulp.task('html', function () {
    gulp.src(['src/*.html']).pipe(gulp.dest('build/'));
});

gulp.task('script', function () {
    gulp.src(SCRIPT_SOURCES)
        //.pipe(sourcemaps.init())
        .pipe(gulpif(/\.ts$/, typescript({
                declarationFiles: false,
                sortOutput: true
            })))
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest('build/'));
});
