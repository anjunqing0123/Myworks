import React,{Component} from 'react';
import {ListItem} from './list-item.js';


/**
	列表组合组件
**/
const Type = 1;
class ChannelGroup extends Component{
	constructor(props) {
		super(props);
	};
	render() {
		let content = this.props.data.list.map((item,index)=>(<ListItem data={item}/>))
		let showStyle = (this.props.data.select == Type)?({display:"block"}):({display:"none"});
		return (
				<section style={showStyle}>
					<ul>{content}</ul>
				</section>
			);
	};
}

export {
	ChannelGroup
}