import React,{Component} from 'react';

export default class Header extends Component{

    constructor(props,context){
        super(props,context);
        this.state ={
            text : ''
        };
    }

    handelChange = (e) => {
        this.setState({
            text : e.target.value
        });
    }

	handelClick = (e) => {
        this.props.actions.addTodo(this.state.text);
        this.setState({
            text : ''
        });
    }

    render(){
        const {addTodo} = this.props;
        return (
            <div>
                <input type="text" value={this.state.text} onChange={this.handelChange} />
                <button onClick={this.handelClick}>add</button>
            </div>
        );
    }
}
module.exports = Header;