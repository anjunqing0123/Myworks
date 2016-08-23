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




var Ul = React.createClass({displayName: "Ul",

  render: function() {
    return (
    	React.createElement("div", null, list)
    );
  }
})

ReactDOM.render(React.createElement(Ul, null), document.getElementById('box1')  
);