'use strict';
module.exports = function(grunt) {
	var transport = require('grunt-cmd-transport');
	var style = transport.style.init(grunt);
	var text = transport.text.init(grunt);
	var script = transport.script.init(grunt);
	var pkg = grunt.file.readJSON('package.json');
	// Project configuration.
	grunt.initConfig({
		copy: {
			build: {
				cwd: pkg.src,
				src: '**/*',
				dest: pkg.build,
				expand: true
			},
		},
		clean: {
			build : {
				src : [pkg.build]
			},
			base: [pkg.build, pkg.file]
		},
		transport: {
			options: {
//				paths: [pkg.src],
				alias: pkg.spm.alias,
				debug: true,
				parsers: {
					'.js': [script.jsParser]
				}
			},
			main: {
				options: {
					debug: false
				},
				files: [{
					expand: true,
					cwd: pkg.src,
					src: '**/*',
//					filter: 'isFile',
					dest: pkg.build
				}]
			}
		},
		concat: {
			main: {
				options: {
					paths: [pkg.src],
					include: 'relative',
				},
				files: [{
					'js/dist/starlive_m.js': 'js/.build/**/*.js'
				}]
			}
		},
		uglify: {
			options: {
				mangle: false
			},
			main: {
				files: {
					'js/dist/starlive_m.js': 'js/dist/starlive_m.js'
				}
			}
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-cmd-transport');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	// Default task(s).
	grunt.registerTask('main', ['clean:base',
								'copy:build',
								'transport:main',
								'concat:main',
								'uglify:main',
								'clean:build'
								]);
	
	grunt.registerTask('test', ['clean:base',
								'copy:build',
								'transport:main',
								'concat:main',
								'clean:build'
								]);
};