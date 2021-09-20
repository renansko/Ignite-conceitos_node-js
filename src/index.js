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

  return next();
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

 
  if(!user){
    return response.status(404).json({error: "User not found"});
  }

  if (!validate(id)) {
    return response.status(400).json({error: "Id, format invalid"});
  } 

  const userid = infoTodos.find((user) => user.id === id);

  if(!userid){
      return response.status(400).json({error: "ID dont found!"})
  }

  request.user = user;
  request.id = id;

  next();

}

function findUserById(request, response, next){
  const { id } = request.params

  const user = users.find((user) => user.id === id);


 if(!validate(id)){
  return response.status(400).json({error: "Id, format invalid"});
 
  }
  
  if(!user){
    return response.status(404).json({error: "User not found"});
  
  };
  
 request.user = user;

 return next();
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
  

  return response.status(201).json({mensage: "Usuario Criado", user});

});

app.get('/users/:id', checksExistsUserAccount,findUserById, (request, response) => {
   const { user } =  request;

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

    return response.status(201).send("Todos was created!");
    
});

app.put('/todos/:id',checksExistsUserAccount, checksTodoExists, (request, response) => {

  const { title, deadline} = request.body;

  const { user , id} = request;
  console.log(id);
  const newTodo = {
   id,
   title,
   deadline: new Date(deadline),
   done: false,
   created_at: new Date(),
 }

 user.todos.push(newTodo);

  return response.status(201).json({ok: "todos as updated!", newTodo});

});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;

  const { user } = request;

  const infoTodos = user.todos;

  const userid = infoTodos.find((user) => user.id === id);

  if(!userid){
      return response.status(400).json({error: "ID dont found!"})
  }
  

  userid.done = true;
  

  return response.status(201).json({ok: "todos as updated!", userid});

});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;

  const { user } = request;

  
   infoTodos = user.todos;

  const userid = infoTodos.find((user) => user.id === id);

  if(!userid){
      return response.status(400).json({error: "ID dont found!"})
  }

  const indexUser = infoTodos.findIndex(
      userIndex => userIndex.id === infoTodos.id);
      infoTodos.splice(indexUser, 1);

  return response.status(200).json({ok: "Todo excluded"});

});

module.exports = app;