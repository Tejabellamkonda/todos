const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const statusPresent = (requestedQuery) => {
  return requestedQuery.status !== undefined;
};

const priorityPresent = (requestedQuery) => {
  return requestedQuery.priority !== undefined;
};

const statusAndPriorityPresent = (requestedQuery) => {
  return (
    requestedQuery.priority !== undefined && requestedQuery.status !== undefined
  );
};

const statusAndCategoryPresent = (requestedQuery) => {
  return (
    requestedQuery.category !== undefined && requestedQuery.status !== undefined
  );
};

const categoryPresent = (requestedQuery) => {
  return requestedQuery.category !== undefined;
};

const priorityAndCategoryPresent = (requestedQuery) => {
  return (
    requestedQuery.category !== undefined &&
    requestedQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  const { priority, search_q = "", status, category } = request.query;

  console.log(priority);

  let getToDos = "";

  switch (true) {
    case statusPresent(request.query):
      getToDos = `SELECT * FROM 
          todo
          WHERE 
          status = '${status}' AND
          todo LIKE '%${search_q}%';`;

      break;
    case priorityPresent(request.query):
      getToDos = `SELECT * FROM 
          todo
          WHERE 
          priority = '${priority}' AND
          todo LIKE '%${search_q}%';`;

      break;

    case statusAndPriorityPresent(request.query):
      getToDos = `SELECT * FROM 
          todo
          WHERE
          priority = '${priority}' 
          status = '${status}' AND
          todo LIKE '%${search_q}%';`;

      break;

    case statusAndCategoryPresent(request.query):
      getToDos = `SELECT * FROM 
          todo
          WHERE
          category = '${category}' 
          status = '${status}' AND
          todo LIKE '%${search_q}%';`;
      break;

    case categoryPresent(request.query):
      getToDos = `SELECT * FROM 
          todo
          WHERE 
          category = '${category}' AND
          todo LIKE '%${search_q}%';`;
      break;

    case priorityAndCategoryPresent(request.query):
      getToDos = `SELECT * FROM 
          todo
          WHERE
          category = '${category}' 
          priority = '${priority}' AND
          todo LIKE '%${search_q}%';`;
      break;

    default:
      getToDos = `
          SELECT * FROM
          todo
          WHERE todo LIKE '%${search_q}%'`;
      break;
  }

  const todoArray = await db.all(getToDos);
  response.send(todoArray);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  console.log(todoId);
  const getTodo = `SELECT * FROM 
    todo
    WHERE 
    id = '${todoId}';`;

  const singleTodo = await db.get(getTodo);
  response.send(singleTodo);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const getTodo = `
    SELECT * FROM todo
    WHERE due_date = '${date}';`;

  const data = await db.all(getTodo);
  response.send(data);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  const addTodoQuery = `
    INSERT INTO todo
    (id,todo,priority,status,category,due_date)
    VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;

  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";

  const requestedBody = request.body;

  switch (true) {
    case requestedBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestedBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestedBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestedBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestedBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }

  const previousTodoQuery = `SELECT
    *
    FROM todo
    WHERE id=${todoId};`;

  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodo = `
    UPDATE todo
    SET todo='${todo}',
        status='${status}',
        priority='${priority}',
        category='${category}',
        due_date='${dueDate}',
    WHERE id = ${todoId}; 
    `;

  await db.run(updateTodo);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodo = `
    DELETE FROM todo
    WHERE id = ${todoId}
    ;`;
  await db.run(deleteTodo);
  response.send("Todo Deleted");
});

module.exports = app;
