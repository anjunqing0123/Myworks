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


var Test = React.createClass({displayName: "Test",
  render: function() {
    return (
      React.createElement("div", null, "sdasdasd")
    );
  }
})

var ProfilePic = React.createClass({displayName: "ProfilePic",

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