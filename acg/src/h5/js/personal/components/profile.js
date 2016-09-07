import "../../../css/modules/photo/profile.less";
import React,{Component} from 'react';
import ReactDOM from 'react-dom';

//人物详情页面头部组件
class Profile extends Component{
	render(){
		let data = this.props.data;
		if(!data) return<div></div> ;
		return (
			<div>
				<img src={data.img}/>
				<h3>{data.name}</h3>
				<div className="">关注 {data.concern} | 粉丝 {data.fans}</div>
				<div className="">简介：{data.introduction}</div>
				<div className="">关注</div>
			</div>);
	}
}
export {Profile}