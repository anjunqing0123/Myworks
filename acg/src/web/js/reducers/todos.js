import actionTypes from '../common/actionTypes';
import * as Actions from '../actions';
import objectAssign from 'object-assign';

const initialState = [{
    text : 'Hello pero pero',
    completed : false,
    id : 1
}]

export default function todos(state = initialState, action){
    switch(action.type){
        case actionTypes.ADD_TODO:
            return [
                ...state,
                {
                    id : state.reduce((maxId, todo) => Math.max(todo.id, maxId), -1) + 1,
                    completed : false,
                    text : action.text
                }
            ];
        case actionTypes.COMPLETE_TODO:
            return state.map(todo =>
                todo.id === action.id ? objectAssign({}, todo, {completed : !todo.completed}) : todo
            );
        default:
            return state;
    }
}