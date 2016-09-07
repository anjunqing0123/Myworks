/**
 * ...
 * @author minliang_1112@foxmail.com
 */

import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import CommonUtils from '../../utils/CommonUtils';

export default class Player extends Component {
	
	constructor(props) {
		super(props);
		this.pid = this.props['pid'];
		this.ctx = 'id=25054099&autoplay=0&w=100%25&h=100%25&videoType=vod&ctx=kk%3D6d89f08bcca44c53a133a39baf662680-1d0f-57c6a6f4%26fwc%3D0%26complete%3D1%26o%3Dm.pptv.com&adConfig=chid%3D8060368%26clid%3D0&pageUrl=http%253A%252F%252Fm.pptv.com%252Fshow%252FkxbLSLAWhsQnpQ0.html&pageRefer=http%253A%252F%252Fm.pptv.com%252F';
	}
	
	static defaultProps = {
		nameProp: ''
	}
	
	static propTypes = {
		nameProp: React.PropTypes.string
	}
	
	render() {
		return (
			<div id={this.pid}>
				<iframe id="h5_player" src={CommonUtils.getPlayerUrl()+this.ctx} scrolling="no" frameborder="0" width="100%" height="100%"></iframe>
			</div>
		)
	}
}