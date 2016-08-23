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




var Ul = React.createClass({

  render: function() {
    return (
    	<div>{list}</div>
    );
  }
})

ReactDOM.render(<Ul/>, document.getElementById('box1')  
);