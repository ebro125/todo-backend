/**
 * client.js
 * Contains all the frontend logic for connecting to the Express API.
 * API_URL is set to target the running server on port 3000.
 */

const API_URL = 'http://localhost:3000/todos';
const todoList = document.getElementById('todo-list');
const form = document.getElementById('add-todo-form');
const input = document.getElementById('todo-title-input');
const statusMessage = document.getElementById('status-message');
const loadingIndicator = document.getElementById('loading-indicator');

// --- Utility Functions ---

/** Displays a temporary message to the user */
function displayMessage(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden', 'bg-red-100', 'text-red-800', 'bg-green-100', 'text-green-800');
    
    if (type === 'error') {
        statusMessage.classList.add('bg-red-100', 'text-red-800', 'text-red-900');
        statusMessage.classList.remove('bg-green-100', 'text-green-800');
    } else {
        statusMessage.classList.add('bg-green-100', 'text-green-800');
        statusMessage.classList.remove('bg-red-100', 'text-red-800', 'text-red-900');
    }

    setTimeout(() => {
        statusMessage.classList.add('hidden');
    }, 3000);
}

/** Renders a single task item */
function createTodoElement(todo) {
    const item = document.createElement('div');
    // Uses the custom 'todo-item' class from style.css along with Tailwind utility classes
    item.className = `todo-item flex items-center justify-between p-4 rounded-lg shadow-sm transition duration-150 ${todo.is_completed ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'}`;

    const titleContainer = document.createElement('div');
    titleContainer.className = 'flex-grow cursor-pointer';
    titleContainer.innerHTML = `
        <span class="text-lg font-medium ${todo.is_completed ? 'line-through text-gray-500' : 'text-gray-800'}">
            ${todo.title}
        </span>
        <span class="block text-xs text-gray-400 mt-0.5">ID: ${todo.id}</span>
    `;
    
    // Toggle on click
    titleContainer.onclick = () => handleToggleComplete(todo.id, todo.is_completed);

    const actions = document.createElement('div');
    actions.className = 'flex items-center space-x-2 ml-4';

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 hover:text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                             </svg>`;
    deleteButton.className = 'p-1 transition duration-150 ease-in-out';
    deleteButton.onclick = (e) => {
        e.stopPropagation(); // Prevent toggling when clicking delete
        handleDeleteTodo(todo.id);
    };

    actions.appendChild(deleteButton);
    item.appendChild(titleContainer);
    item.appendChild(actions);
    return item;
}

// --- API CALLS (CRUD) ---

/** GET: Fetches all todos from the Express backend. */
async function fetchTodos() {
    loadingIndicator.classList.remove('hidden');
    try {
        const response = await fetch(API_URL);
        const todos = await response.json();

        todoList.innerHTML = ''; // Clear existing list
        
        if (todos.length === 0) {
            todoList.innerHTML = '<p class="text-center text-gray-500">Your list is empty! Add a new task above.</p>';
        } else {
            todos.forEach(todo => {
                todoList.appendChild(createTodoElement(todo));
            });
        }
    } catch (error) {
        console.error('Error fetching todos:', error);
        displayMessage('Failed to connect to backend (Is the Node server running on port 3000?).', 'error');
        todoList.innerHTML = '<p class="text-center text-red-500">Error loading tasks. Check the console and ensure your backend server is running.</p>';
    } finally {
         loadingIndicator.classList.add('hidden');
    }
}

/** POST: Adds a new todo via the Express backend. */
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = input.value.trim();

    if (!title) {
        displayMessage("Task title cannot be empty.", 'error');
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title })
        });

        if (response.status === 201) {
            // Success: 201 Created
            input.value = ''; // Clear input
            fetchTodos(); // Refresh the list
            displayMessage('Task added successfully!');
        } else if (response.status === 400) {
            // Failure: 400 Bad Request (Validation from backend)
            const error = await response.json();
            displayMessage(`Error: ${error.message}`, 'error');
        } else {
            displayMessage(`Server error (Status ${response.status}).`, 'error');
        }

    } catch (error) {
        console.error('Error adding todo:', error);
        displayMessage('Network error. Could not connect to the backend.', 'error');
    }
});

/** PATCH: Toggles the completion status of a task. */
async function handleToggleComplete(id, currentStatus) {
    const newStatus = !currentStatus;
    const url = `${API_URL}/${id}`;
    const updates = { is_completed: newStatus };

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (response.status === 200) {
            fetchTodos(); 
            displayMessage(`Task ${id} status toggled!`);
        } else if (response.status === 404) {
            displayMessage(`Task ${id} not found.`, 'error');
        } else {
            displayMessage(`Failed to update task (Status ${response.status}).`, 'error');
        }

    } catch (error) {
        console.error('Error toggling complete status:', error);
        displayMessage('Network error during update.', 'error');
    }
}

/** DELETE: Removes a task. */
async function handleDeleteTodo(id) {
    // Note: Since alert/confirm are forbidden in this environment, 
    // we assume the delete button click confirms the action.
    
    const url = `${API_URL}/${id}`;

    try {
        const response = await fetch(url, {
            method: 'DELETE'
        });

        if (response.status === 204) {
            fetchTodos(); 
            displayMessage(`Task ${id} deleted successfully!`);
        } else if (response.status === 404) {
            displayMessage(`Task ${id} not found.`, 'error');
        } else {
            displayMessage(`Failed to delete task (Status ${response.status}).`, 'error');
        }
    } catch (error) {
        console.error('Error deleting todo:', error);
        displayMessage('Network error during delete.', 'error');
    }
}

// Initial fetch when the page loads
document.addEventListener('DOMContentLoaded', fetchTodos);
