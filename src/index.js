const express = require('express');
const cors = require('cors');
const { v4: uuidv4, validate  } = require('uuid');
const { json } = require('express');



const app = express();

app.use(cors());
app.use(express.json());

const users = []; 


function checksExistsUserAccount(request, response, next) {

  const { username } = request.headers;
    
  const user = users.find((user) => user.username === username);

  if(!user){
      return response.status(404).json({error: "User not found"});
  }

 request.user = user;

   next();
};

function checksCreateTodosUserAvailability(request, response, next){
  const { user } = request;


  if(user.pro || user.todos.length < 10){
    return next();
    
  }
  return response.status(403).json({ error: "Error of number the todos" });
};

function checksTodoExists(request, response, next){
  const { username } = request.headers;
  const { id } = request.params;

  
  const user = users.find((user) => user.username === username);
  
  const infoTodos = user.todos;

  const todo = infoTodos.find((user) => user.id === id);

 
  if(!user){
    return response.status(404).json({error: "User not found"});
  }
  
  if(!todo){
      return response.status(404).json({error: "ID dont found!"})
  }

  if (!validate(id)) {
    return response.status(400).json({error: "Id, format invalid"});
  } 


  request.todo = todo;
 

  next();

}

function findUserById(request, response, next){
  const { id } = request.params

  const user = users.find((user) => user.id === id);


 if(!validate(id)){
  return response.status(400).json({error: "Id, format invalid"});
 
  }
  
 request.user = user;

 next();
}

app.post('/users', (request, response) => {
  const { name , username } = request.body;
    
  const userAlreadyExist = users.some((user) => user.username === username);

  if(userAlreadyExist){
      return response.status(400).json({error: "User already Exists!"});
  }

  const user = {
      name,
      username,
      pro: false,
      id: uuidv4(),
      todos: []

  };
  
  users.push(user);
  

  return response.status(201).json(user);

});

app.get('/users/:id', checksExistsUserAccount,findUserById, (request, response) => {
   const { user } =  request;

    return response.json(user);
});

app.patch("/users/:id/pro", findUserById, (request, response) => {
  const { user } = request;

  if (user.pro) {
    return response
      .status(400)
      .json({ error: "Pro plan is already activated." });
  }
  user.pro = true;

  return response.json(user);
});



app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } =  request;

    return response.json(user.todos);
});


app.post('/todos', checksExistsUserAccount,checksCreateTodosUserAvailability,(request, response) => {
    const {title , deadline} = request.body;

    const { user } = request;

    const todosOperation= {
        id: uuidv4(),
        title,
        done: false,
        deadline: new Date(deadline),
        created_at: new Date()
    };

    user.todos.push(todosOperation);

    if(user.todos.length >= 10){
      user.pro = true
    }

    return response.status(201).json(todosOperation);
    
});

app.put('/todos/:id', checksTodoExists,(request, response) => {

  const { todo } = request;
  const { title, deadline } = request.body;
 
  
  todo.title = title 
  todo.deadline = new Date(deadline) 
  
  
  return response.json(todo);
});

app.patch('/todos/:id/done', checksTodoExists,(request, response) => {

  const { todo } = request;

  todo.done = true;
  
  return response.status(201).json(todo);

});

app.delete('/todos/:id', checksExistsUserAccount, checksTodoExists,  (request, response) => {

 
  const { user , todo } = request; 
 
  const todoIndex = user.todos.indexOf(todo);

  if (todoIndex === -1) {
    return response.status(404).json({ error: "Todo not found" });
  }

   user.todos.splice(todoIndex, 1);

  return response.status(204).json();

});

module.exports = app;