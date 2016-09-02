/**
 * ...
 * @author minliang_1112@foxmail.com
 */

import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Player from './components/Player';
import CommonUtils from '../utils/CommonUtils';
import $ from 'expose?$!jquery';
	
ReactDOM.render(
	<Player pid='player_box'/>,
	CommonUtils.getDom('app')
);