// Copyright © 2015 authors, see package.json
//
// all rights reserved

var concat = require('gulp-concat');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var sourcemaps = require('gulp-sourcemaps');
var typescript = require('gulp-typescript');

gulp.task('default', ['script', 'html']);

gulp.task('watch', ['script', 'html'], function() {
    gulp.watch('*.html', ['html']);
    gulp.watch(['*.ts', '*.js'], ['script']);
});

gulp.task('html', function () {
    gulp.src(['src/*.html']).pipe(gulp.dest('build/'));
});

gulp.task('script', function () {
    gulp.src(['*.ts', '*.js'])
        //.pipe(sourcemaps.init())
        .pipe(gulpif(/\.ts$/, typescript({
                declarationFiles: false,
                sortOutput: true
            })))
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest('./'));
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3VscGZpbGUuanMiLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJndWxwZmlsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgwqkgMjAxNSBhdXRob3JzLCBzZWUgcGFja2FnZS5qc29uXG4vL1xuLy8gYWxsIHJpZ2h0cyByZXNlcnZlZFxuXG52YXIgY29uY2F0ID0gcmVxdWlyZSgnZ3VscC1jb25jYXQnKTtcbnZhciBndWxwID0gcmVxdWlyZSgnZ3VscCcpO1xudmFyIGd1bHBpZiA9IHJlcXVpcmUoJ2d1bHAtaWYnKTtcbnZhciBzb3VyY2VtYXBzID0gcmVxdWlyZSgnZ3VscC1zb3VyY2VtYXBzJyk7XG52YXIgdHlwZXNjcmlwdCA9IHJlcXVpcmUoJ2d1bHAtdHlwZXNjcmlwdCcpO1xuXG5ndWxwLnRhc2soJ2RlZmF1bHQnLCBbJ3NjcmlwdCcsICdodG1sJ10pO1xuXG5ndWxwLnRhc2soJ3dhdGNoJywgWydzY3JpcHQnLCAnaHRtbCddLCBmdW5jdGlvbigpIHtcbiAgICBndWxwLndhdGNoKCcqLmh0bWwnLCBbJ2h0bWwnXSk7XG4gICAgZ3VscC53YXRjaChbJyoudHMnLCAnKi5qcyddLCBbJ3NjcmlwdCddKTtcbn0pO1xuXG5ndWxwLnRhc2soJ2h0bWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgZ3VscC5zcmMoWydzcmMvKi5odG1sJ10pLnBpcGUoZ3VscC5kZXN0KCdidWlsZC8nKSk7XG59KTtcblxuZ3VscC50YXNrKCdzY3JpcHQnLCBmdW5jdGlvbiAoKSB7XG4gICAgZ3VscC5zcmMoWycqLnRzJywgJyouanMnXSlcbiAgICAgICAgLnBpcGUoc291cmNlbWFwcy5pbml0KCkpXG4gICAgICAgIC5waXBlKGd1bHBpZigvXFwudHMkLywgdHlwZXNjcmlwdCh7XG4gICAgICAgICAgICAgICAgZGVjbGFyYXRpb25GaWxlczogZmFsc2UsXG4gICAgICAgICAgICAgICAgc29ydE91dHB1dDogdHJ1ZVxuICAgICAgICAgICAgfSkpKVxuICAgICAgICAucGlwZShzb3VyY2VtYXBzLndyaXRlKCkpXG4gICAgICAgIC5waXBlKGd1bHAuZGVzdCgnLi8nKSk7XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
