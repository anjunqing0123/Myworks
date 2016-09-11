/**
 * ...
 * @author minliang_1112@foxmail.com
 */

import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Player from '../play/components/Player';
import CommonUtils from '../utils/CommonUtils';
import $ from 'jquery';
//import $ from 'n-zepto';
	
// ReactDOM.render(
// 	<Player pid='player_box'/>,
// 	CommonUtils.getDom('app')
// );




// LCX Edit  Start
import PlayInfo from '../play/components/PlayInfo';	
import VideoTag from '../play/components/VideoTag';	

var data = {
	msg : '简介',
	info: '高中生齐木楠雄是超能力者。心灵感应、念动力、透视、预知、瞬间移动、千里眼，不论任何...'
};

ReactDOM.render(
	<div>
		<Player pid='player_box'/>   
		<PlayInfo data={data} />
		<VideoTag data={data} />
	</div>,
	CommonUtils.getDom('app')
);
// LCX Edit  End


