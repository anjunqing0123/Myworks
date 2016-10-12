'use strict';
module.exports = function (grunt) {
	//
	var transport = require('grunt-cmd-transport');
	var style = transport.style.init(grunt);
	var text = transport.text.init(grunt);
	var script = transport.script.init(grunt);
	var fs = require('fs');
	var pkg = grunt.file.readJSON('package.json');
	var aliasInfo = {
					'zepto'  : 'lib/zepto/1.2.0/zepto',
					'common' : 'js/commons/common',
					'modulename' : 'js/commons/modules-name',
					'store'  : 'js/models/store',
					'todo'   : 'js/actions/todo',
					'vue'    : 'lib/vue/1.0.24/vue'
				}
	var seacfg = 'seajs.config({\n'
					+'				base: "' + pkg.dist + '",\n'
					+'				alias: ' + JSON.stringify(aliasInfo) + '\n'
					+'			});'
	//
	grunt.initConfig({
		clean: {
			build : {
				src : [pkg.build]
			},
			options: {
				paths: ['.']
			},
			base: [pkg.build, pkg.dist]
		},
		//文件复制
		copy : {
			build : {
				files : [{
							expand : true,
							cwd: pkg.src + 'lib/seajs/3.0.0/',
							src : 'sea.js',
							dest: pkg.build + 'lib/seajs/3.0.0/'
						},{
							expand : true,
							cwd: pkg.src + 'lib/vue/1.0.24/',
							src : 'vue.js',
							dest: pkg.build + 'lib/vue/1.0.24/'
						},{
							expand : true,
							cwd: pkg.src + 'js/',
							src : ['**/*.js', '!**/*.es6.js', '!**/*_backup.js'],
							dest: pkg.build + 'js/'
						},{
							expand : true,
							cwd : pkg.src + 'css/',
							src : '**/*',
							dest: pkg.dist + 'css/'
						},{
							expand : true,
							cwd : pkg.src + 'assets/',
							src : '**/*',
							dest: pkg.dist + 'assets/'
						}]
					},
			devbuild : {
				files : [{
							expand : true,
							cwd: pkg.build,
							src : ['**/*.js'],
							dest: pkg.dist
						}]
					},
		},
		//合并文件
		concat : {
			build : {
				options : {
							noncmd: true
						},
				files : {
							[pkg.build + 'lib/zepto/1.2.0/zepto.js'] : [pkg.src + 'lib/zepto/1.2.0/zepto.js', pkg.src + 'lib/zepto/1.2.0/zepto-plugin/*.js']
						}
			}
		},
		//es6转为es5
		babel : {
			build : {
				options : {
							presets: ['es2015']
						},
				files : { }
			}
		},
		transport : {  
            options: {
				debug : false,
				alias : aliasInfo,
				parsers: {
							'.js': [script.jsParser],
							'.css': [style.css2jsParser],
							'.html': [text.html2jsParser]
						}
            }
        },
		//文件压缩
		uglify : {
			build : {
				files : [{
							expand : true,
							cwd : pkg.build,
							src : ['**/*.js'],
							dest : pkg.dist
						}]
			}
		},
		//文件修改监控
		watch : {
			build : {
				files : [pkg.src + '/**/*.js', pkg.src + '/**/*.css'],
				tasks : ['dev'],
				options : {
							debounceDelay : 0.1 * 1000,
							reload : false,
							livereload : true
						}
			}
		}
	});
	
	var cfg = grunt.config.data,
		filelist,
		es6list = [],
		limitsize = 0,
		isExceptFile = (filePath) => /css|assets|es6|_backup/ig.test(filePath),
		walk = (path)=>{
					var list = [];
					fs.readdirSync(path).forEach((item)=>{
													item = path + '/' + item;
													var items = fs.statSync(item);
													if (items && items.isDirectory()) {
														list = list.concat(walk(item));
													} else list.push(item);
												});
					return list;
				};
	var build = (option)=>{
					var $dest = (option == 'dev' || option == 'test')? pkg.dist : pkg.build;
					es6list = walk(pkg.src);
					es6list.forEach((item, index)=>{
										if (isExceptFile(item) && item.indexOf('es6') != -1) {
											grunt.log.writeln(`必须构建为ES5的File ==>> ${item}`);
											var dest = pkg.build + item.substring(pkg.src.length + 1).replace(/.es6/ig, '');
											cfg.babel.build.files[dest] = item;
										}
									});
					var templist = [];
					filelist = walk(pkg.src);
					filelist.forEach((item, index)=>{
										if (!isExceptFile(item)) {
											item = item.substring(pkg.src.length + 1, item.lastIndexOf('/'));
											if (templist.indexOf(item) == -1) {
												templist.push(item);
												var buildName = `transport.build${index}`;
												grunt.config.set(`${buildName}.options.idleading`, item + '/');
												grunt.config.set(buildName + '.files', [{
																							expand : true,
																							cwd : pkg.build + item,
																							src : ['**/*.js'],
																							filter: 'isFile',
																							dest: $dest + item
																						}]);
											}
										}
									});
					var buildArr = [
									'clean:base',
									'copy:build',
									'concat:build',
									'babel:build'
								];
					for(let i in cfg.transport) {
						if (i.indexOf('build') != -1) {
							buildArr.push('transport:' + i);
						}
					}
					if (option == undefined) {
						buildArr = buildArr.concat([
													'uglify:build',
													'clean:build'
												]);
					} else if (option == 'dev') {
						buildArr = buildArr.concat([
													'copy:devbuild',
													'clean:build',
													'watch:build'
												]);
					} else if (option == 'test') {
						buildArr = buildArr.concat([
													'copy:devbuild',
													'clean:build'
												]);
					}
					grunt.task.run(buildArr);
				}
	
	grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-cmd-concat');
	grunt.loadNpmTasks('grunt-cmd-transport');
    grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	
	grunt.registerTask('execute', 'clean, concat, copy, transport and uglify task', function() {
																								build();
																							});
	grunt.registerTask('dev', 'clean, concat, copy, transport and uglify task', function() {
																							build('dev');
																						});
	grunt.registerTask('test', 'clean, concat, copy, transport and uglify task', function() {
																							build('test');
																						});
}