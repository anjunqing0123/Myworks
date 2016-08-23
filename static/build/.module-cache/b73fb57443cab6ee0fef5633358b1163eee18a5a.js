// React.render(
//   <h1>Hello, world!</h1>,
//   document.getElementById('box1')
// );
// 
// 
// 
// 
// 
// 


var Li = React.createClass({displayName: "Li",
  render: function() {
    return (
      React.createElement("div", null)
    );
  }
})

var ul = React.createClass({displayName: "ul",

  render: function() {
    return (
    	React.createElement("div", null, 
	      React.createElement(Test, null), 
	      this.props.name
    	)
    );
  }
})

ReactDOM.render(React.createElement(ProfilePic, {name: "xiateng"}), document.getElementById('box1')  
);