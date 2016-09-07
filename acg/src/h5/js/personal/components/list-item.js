import React,{Component} from 'react'
import ReactDOM from 'react-dom';

/**
	图文列表ITEM组件
**/
class ListItem extends Component{
	constructor(props) {
		super(props);
	};
	render() {
		return (
			<li>
    			<a href="">
    				<img src={this.props.data.img}></img>
    				<p>{this.props.data.title}</p>
    			</a>
    		</li>
		);
	}
}

export {ListItem};