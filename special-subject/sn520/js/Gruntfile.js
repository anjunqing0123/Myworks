'use strict';
module.exports = function (grunt) {
	var transport = require('grunt-cmd-transport');
	var style = transport.style.init(grunt);
	var text = transport.text.init(grunt);
	var script = transport.script.init(grunt);
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			build : {
				src : ['.build/']
			},
			options: {
				paths: ['.']
			},
			base: ['dist', '.build']
		},
		transport: {
			options: {
				paths: ['src/'],
				alias: '<%= pkg.spm.alias %>',
				debug: false,
				parsers: {
					'.js': [script.jsParser],
					'.css': [style.css2jsParser],
					'.html': [text.html2jsParser]
				}
			},
			main: {
				options:{
					debug: false
				},
				files: [
					{
						expand: true,
						cwd: 'src/',
						src: ['**/*', '!**/seajs*', '!**/demo-*'],
						filter: 'isFile',
						dest: '.build'
					}
				]
			}
		},

		concat: {
			main: {
				options: {
					paths: ['src'],
					include: 'relative',
				},
				files: [
					{
						'dist/sn_pc.js': '.build/pc/**/*.js',
						'dist/sn_m.js': ['.build/m/**/*.js', '!**/seajs-*'],
					}
				]
			}
		},
		uglify: {
			options: {
				mangle: false
			},
			main: {
				files: {
					'dist/sn_pc.js': ['dist/sn_pc.js'],
					'dist/sn_m.js': ['dist/sn_m.js']
				}
			}
		}
	})
	;

// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-cmd-transport');
	grunt.loadNpmTasks('grunt-cmd-concat');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');


// Default task(s).
	grunt.registerTask('default', ['clean:base']);
//grunt.registerTask('test', ['transport']);
	grunt.registerTask('main', [
		'clean:base',
		'transport:main',
		'concat:main',
		// 'uglify:main',
		'clean:build'
	]);
}
;
