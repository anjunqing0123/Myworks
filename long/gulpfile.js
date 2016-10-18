var gulp = require('gulp'),
    less = require('gulp-less'),
    cssmin = require('gulp-cssmin'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    webserver = require('gulp-webserver');

//编译less
gulp.task('testLess', function () {
    gulp.src('src/less/*.min.less')
        .pipe(less())
        .pipe(gulp.dest('src/css'));
});

//css 压缩
gulp.task("css", function () {
    gulp.src(['src/css/*.min.css'])
        .pipe(cssmin())
        .pipe(gulp.dest("dist/css/"))
});

//js 压缩
gulp.task("js", function () {
    gulp.src(['src/js/**/*.js'])
        .pipe(uglify({
            mangle: true,//类型：Boolean 默认：true 是否修改变量名
}))
        .pipe(gulp.dest("dist/js/"))
})

//图片压缩
gulp.task('images', function () {
    return gulp.src('src/img/*')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/img/'));
});


//启动本地服务器
gulp.task('web', function() {
    gulp.src('')
        .pipe(webserver({
            host:'127.0.0.1',
            port:'8080',
            livereload: true,
            directoryListing: true,
            open: '_index.html'
        }));
});

// 构建项目到dist文件
gulp.task('default',['testLess','css','images','js']);

//自动监控css
// gulp.task('testWatch', function () {
//     gulp.watch('src/**/*.css', ['testLess','css','images','js']);
// });
