var gulp = require('gulp'),
    less = require('gulp-less'),
    cssmin = require('gulp-cssmin'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    webserver = require('gulp-webserver');

//编译less
gulp.task('testLess', function () {
    gulp.src('static/less/*.min.less')
        .pipe(less())
        .pipe(gulp.dest('static/src/css'));
});

//css 压缩
gulp.task("css", function () {
    gulp.src(['static/src/css/*.min.css'])
        .pipe(cssmin())
        .pipe(gulp.dest("static/dist/css/"))
});

//js 压缩
gulp.task("js", function () {
    gulp.src(['static/src/js/**/*.js'])
        .pipe(uglify({
            mangle: true,//类型：Boolean 默认：true 是否修改变量名
}))
        .pipe(gulp.dest("static/dist/js/"))
})

//图片压缩
gulp.task('images', function () {
    return gulp.src('static/img/*')
        .pipe(imagemin())
        .pipe(gulp.dest('static/dist/img/'));
});


//启动本地服务器
gulp.task('web', function() {
    gulp.src('')
        .pipe(webserver({
            host:'127.0.0.1',
            port:'8080',
            livereload: true,
            directoryListing: true,
            open: 'static/_index.html'
        }));
});
gulp.task('default',['testLess','css','images','js']);
//自动监控css
gulp.task('testWatch', function () {
    gulp.watch('static/src/**/*.css', ['default']);
});

// gulp.task('default', ['css', 'js','images', 'font','webserver'])