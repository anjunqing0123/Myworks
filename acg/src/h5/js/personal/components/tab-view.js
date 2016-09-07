import React,{Component} from 'react';
import ReactDOM from 'react-dom';

/**
	tab组件
**/
class Tab extends Component{	
	constructor (props){
    	super(props);
  	}

	tabClick = (e) => {
		this.props.tabClick(this.props.index);
	}

	render() {
		return <li className={this.props.activityClass}>
				 <a href="javascript:;"  onClick={this.tabClick} >{this.props.value}</a>
			   </li>;
	}
}

class TabView extends Component{
	constructor(props) {
    	super(props);
 	}
	tabClickHandle = (index) =>{
		
	}
	render() {
		let data = this.props.data;	
		if(!data) return<ul></ul>;
		let items = data.tag.map((v,i) => <Tab key={i} value={v.value} index={v.index} tabClick={this.tabClickHandle} activityClass= {(data.select == v.index) ? data.activityClass : undefined}/>);
		return (<ul>{items}</ul>);
	}
}

export {
	TabView
}