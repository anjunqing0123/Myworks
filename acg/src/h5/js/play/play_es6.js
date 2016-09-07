/**
 * ...
 * @author minliang_1112@foxmail.com
 */

import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Player from './components/Player';
import CommonUtils from '../utils/CommonUtils';
import $ from 'n-zepto';
//import $ from 'jquery';
	
ReactDOM.render(
	<Player pid='player_box'/>,
	CommonUtils.getDom('app')
);