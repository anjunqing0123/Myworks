/*
 * @author  Chengxiang Li
 * @qq   	1014410609
 * @email   chengxiangli@pptv.com
 * @info    PeroPero H5承载页 播放分享承载页 播放信息模块
 */


import React, {Component} from 'react';
import ReactDOM from 'react-dom';

export default class PlayInfo extends Component {

	constructor(props) {
		super(props);
		// this.msg = this.props['msg'];
		this.data = this.props['data'];
	}
	
	render() {
		return (  
			<div> 
				<h4>{ this.data.msg }</h4>
				<p>{ this.data.info }</p>
			</div>
		)
	}
}


















