// 1. APPLICATION STATE
// - Holds the state of the application
// - This is the single source of truth for the application state

import TodoItem from './todo-item.js';

const todos = [
  new TodoItem('WMC programmieren', false, 1),
  new TodoItem('CABS lernen', false, 3),
  new TodoItem('NSCS lernen', true, 2),
  new TodoItem('POS/Theorie lernen', false, 2),
  new TodoItem('POS/Java üben', false, 1)
];


// 2. STATE ACCESSORS/MUTATORS FN'S
// - Functions that allow us to get and set the state
// - Here we will create functions to add and remove todos

function addTodo(text) {
  todos.push(new TodoItem(text));
}

function removeTodo(todo) {
  const index = todos.indexOf(todo);
  if (index !== -1) {
    todos.splice(index, 1);
  }
}

function toggleTodo(todo) {
  todo.toggleCompleted();
}


// 3. DOM Node Refs
// - Static references to DOM nodes needed after the start of the application

const todoInput = document.getElementById('todo-input');
const addButton = document.getElementById('todo-add');
const todoList = document.getElementById('todo-list');
const todoListDone = document.getElementById('todo-list-done');


// 4. DOM Node Creation Fn's
// - Dynamic creation of DOM nodes needed upon user interaction
// - Here we will create a function that will create a todo item

function createTodoElement(todo) {
  const listItem = document.createElement('li');
  listItem.className = 'todo-item';
  if (todo.completed) {
    listItem.classList.add('is-complete');
  }

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'todo-toggle';
  checkbox.checked = todo.completed;
  checkbox.addEventListener('change', () => onTodoToggled(todo));

  const text = document.createElement('span');
  text.className = 'todo-text';
  text.textContent = todo.text;

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'todo-delete';
  deleteButton.textContent = 'Delete';
  deleteButton.addEventListener('click', () => onDeleteClicked(todo));

  listItem.append(checkbox, text, deleteButton);
  return listItem;
}


// 5. RENDER FN
// - These functions will render the application state to the DOM
// - Here we will use a very naive but simple approach to re-render the list
// - IMPORTANT TAKEAWAY: The state drives the UI, any state change should trigger a re-render of the UI

function render() {
  todoList.innerHTML = '';
  todoListDone.innerHTML = '';

  for (const todo of todos) {
    const element = createTodoElement(todo);
    if (todo.completed) {
      todoListDone.append(element);
    } else {
      todoList.append(element);
    }
  }
}


// 6. EVENT HANDLERS
// - These functions handle user interaction e.g. button clicks, key presses etc.
// - These functions will call the state mutators and then call the render function
// - The naming convention for the event handlers is `on<Event>`
// - Here we will create a function that will handle the add button click

function onAddClicked() {
  const text = todoInput.value.trim();
  if (text === '') {
    return;
  }
  addTodo(text);
  todoInput.value = '';
  render();
}

function onInputKeyDown(event) {
  if (event.key === 'Enter') {
    onAddClicked();
  }
}

function onTodoToggled(todo) {
  toggleTodo(todo);
  render();
}

function onDeleteClicked(todo) {
  removeTodo(todo);
  render();
}


// 7. INIT BINDINGS
// - These are the initial bindings of the event handlers

addButton.addEventListener('click', () => onAddClicked());
todoInput.addEventListener('keydown', (event) => onInputKeyDown(event));


// 8. INITIAL RENDER
// - Here will call the render function to render the initial state of the application

render();
