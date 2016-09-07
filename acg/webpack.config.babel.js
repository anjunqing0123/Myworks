'use strict';

import webpack from 'webpack';
import path from 'path';

let projectRoot = path.resolve(__dirname, './dist');

export default {
				entry : {
							play : './src/h5/js/play/play_es6',
							personal : './src/h5/js/personal/personal_es6',
							webApp: './src/web/js/views/App'
						},
				output: {
							path: projectRoot,
							filename : '[name].js'
						},
				module: {
							loaders: [
										 /* 导入全局jQuery */
										{
											test: require.resolve('jquery'),
											loader: 'expose?jQuery!expose?$'
										},{ 
											test: /\.js?$/,
											loaders: ['babel?presets[]=react,presets[]=es2015,presets[]=stage-0'], 
											exclude: /node_modules/
										}
									]
						},
				plugins: [
							
						]
			};
