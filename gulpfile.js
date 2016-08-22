var gulp = require('gulp'),
    less = require('gulp-less');
 
gulp.task('testLess', function () {
    gulp.src(['static/less/*.less'])
        .pipe(less())
        .pipe(gulp.dest('static/css'));
});
 
gulp.task('testWatch', function () {
    gulp.watch('static/**/*.less', ['testLess']); //当所有less文件发生改变时，调用testLess任务
});