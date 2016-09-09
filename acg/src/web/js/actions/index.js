import actionTypes from '../common/actionTypes'

export function addTodo(text) {
  return { type: actionTypes.ADD_TODO, text }
}

export function completeTodo(id) {
  return { type: actionTypes.COMPLETE_TODO, id }
}


