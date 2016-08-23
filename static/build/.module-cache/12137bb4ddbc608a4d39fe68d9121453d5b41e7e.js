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
      React.createElement("div", null, this.props.name)
    );
  }
})


var s = ['xiateng','sdasd']
var Ul = React.createClass({displayName: "Ul",

  render: function() {
    return (
    	React.createElement("div", null, 
	      React.createElement(Li, {name: "sdasda"}), 
	      React.createElement(Li, {name: "sdas131212da"})
    	)
    );
  }
})

ReactDOM.render(React.createElement(Ul, null), document.getElementById('box1')  
);