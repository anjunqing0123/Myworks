import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as Actions from '../actions';

class bindAction{
    mapStateToProps(state){
        return {
            todos : state.todos
        }
    }
    mapDispatchToProps(dispatch){
        return{
            actions : bindActionCreators(Actions, dispatch)
        }
    }
    bind(app){
        return connect(
            this.mapStateToProps,
            this.mapDispatchToProps
        )(app);
    }
}

export default new bindAction();