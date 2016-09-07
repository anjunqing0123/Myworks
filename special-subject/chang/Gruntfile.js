//'use strict';
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
				src : ['<%= pkg.build %>']
			},
			options: {
				paths: ['.']
			},
			base: ['<%= pkg.build %>', '<%= pkg.out %>']
		},
		transport: {
			options: {
				paths: ['js/'],
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
					// idleading: 'pub/'
					debug: false
				},
				files: [
					{
						expand: true,
						cwd: 'js/',
						src: ['**/*', '!sea', '!**/demo-*', '!app/*config*', '!app/resize*', '!app/idol/**'],
						filter: 'isFile',
						dest: '<%= pkg.build %>'
					}
				]
			}
		},

		concat: {
			main: {
				options: {
					paths: ['<%= pkg.out %>'],
					include: 'relative',
					banner: '/*! <%= pkg.name %> create by <%= pkg.author %> */\n'	//<%= grunt.template.today("yyyy-mm-dd") %>
				},
				files: [
					{
						expand: true,
						cwd: '<%= pkg.build %>',
						src: '**',
						filter: 'isFile',
						dest: '<%= pkg.out %>'
					}
				]
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


	//grunt.
	grunt.registerTask('default', [
		'clean:base',
		'transport:main',
		'concat:main',
		'clean:build'
	]);
}
;
