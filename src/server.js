import express from 'express'
import dotenv from 'dotenv'
dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Middleware to parse JSON request bodies
app.use(express.json());

// --- 1. CORE SERVICE LAYER (BUSINESS LOGIC) ---

const TodoService = {

    todos: [],
    nextId: 1,

    /**
     * Simulates POST /todos (Create).
     * Returns 201 Created on success, 400 Bad Request on failure.
     */
    createTodo(title) {
        // Input Validation
        if (!title || title.trim() === "") {
            return { 
                status: 400, 
                message: "Validation Error: The task title is required."
            };
        }

        const newTask = {
            id: this.nextId++,
            title: title.trim(),
            is_completed: false,
            created_at: new Date().toISOString(),
        };

        this.todos.push(newTask);
        
        // Success: 201 Created
        return { 
            status: 201, 
            data: newTask 
        };
    },

    getallTodo(){
        //Status : 200 OK
         return{
            status : 200,
            data : this.todos
         };
    },
    
     /**
     * Simulates GET /todos/:id (Read One).
     * Returns 200 OK or 404 Not Found.
     */
    getTodobyID(id){

        const todo = this.todos.find(t => t.id === parseInt(id));

        if(!todo){
            return{
                status: 404, 
                message: `Task ID ${id} is not found`
            }
        }
        return{
            status: 200, 
            data: todo
        };
    },

    /**
     * Simulates PATCH /todos/:id (Update - Partial).
     * Returns 200 OK or 404 Not Found.
     */
    updateTodo(id, updates){
        const todoID = parseInt(id);
        const index = this.todos.findIndex(t => t.id === todoID);

        const todo = this.todos[index];

        if(index == -1){
            return{
                status: 404, 
                message: `Task ID ${id} is not found`
            }
        }
        // Apply updates safely
        if (updates.title !== undefined) {
            if (typeof updates.title !== 'string' || updates.title.trim() === '') {
                 // Simulate validation if title is present but invalid
                 return { status: 400, message: "Validation Error: Title cannot be empty." };
            }
            todo.title = updates.title.trim();
        }
        
        if (updates.is_completed !== undefined && typeof updates.is_completed === 'boolean') {
            todo.is_completed = updates.is_completed;
        }

        todo.updated_at = new Date().toISOString();
        
        // Success: 200 OK
        return { status: 200, data: todo };
    },

    /**
     * Simulates DELETE /todos/:id (Delete).
     * Returns 204 No Content or 404 Not Found.
     */
    deleteTodo(id) {
        const todoId = parseInt(id);
        const initialLength = this.todos.length;
        this.todos = this.todos.filter(t => t.id !== todoId);

        if (this.todos.length === initialLength) {
            // Failure: 404 Not Found
            return { status: 404, message: `Task ID ${id} not found.` };
        }

        // Success: 204 No Content
        return { status: 204, message: "Task deleted successfully." };
    }
};

// CONTOLLERS / ROUTER (EXPRESS)

app.post('/todos' ,  (req , res) =>{
    const {title} = req.body

    const response = TodoService.createTodo(title);
    if(response.status == 400){
        return res.status(400).json({message : response.message});
    }

     return res.status(201).json(response.data);
});

app.get('/todos' ,(req,res) => {
     
    const response = TodoService.getallTodo();

    return res.status(200).json(response.data);
})

app.get('/todos/:id' ,(req,res) => {
    
    const  {id} = req.params
    const response = TodoService.getTodobyID(id);
    
    if(response == 404){
         return res.status(404).json({message : response.message});
    }
    return res.status(200).json(response.data);
})

app.patch('/todos/:id' ,(req,res) => {
    
    const  {id} = req.params
    const response = TodoService.getTodobyID(id);
    
    if(response == 404){
         return res.status(404).json({message : response.message});
    }
    return res.status(200).json(response.data);
})
app.patch('/todos/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body; // e.g., { is_completed: true }

    const response = TodoService.updateTodo(id, updates);

    if (response.status === 404) {
        // Return 404 Not Found
        return res.status(404).json({ message: response.message });
    }
    if (response.status === 400) {
        // Return 400 Bad Request (for invalid updates)
        return res.status(400).json({ message: response.message });
    }

    // Return 200 OK
    res.status(200).json(response.data);
});


// DELETE /todos/:id (Delete a task)
app.delete('/todos/:id', (req, res) => {
    const { id } = req.params;
    const response = TodoService.deleteTodo(id);

    if (response.status === 404) {
        // Return 404 Not Found
        return res.status(404).json({ message: response.message });
    }

    // Return 204 No Content (Successful deletion with no body)
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
});
