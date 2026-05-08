// App Component - Main component that holds everything together

function App() {
  // State - stores data
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  const API_URL = 'http://localhost:5000/api/tasks';

  // Fetch tasks when page loads
  React.useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Add new task
  function addTask(newTask) {
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    })
    .then(res => res.json())
    .then(task => {
      setTasks([task, ...tasks]);
    });
  }

  // Move task to next status
  function moveTask(id, currentStatus) {
    const newStatus = currentStatus === 'todo' ? 'inprogress' : 'done';
    
    fetch(API_URL + '/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    .then(res => res.json())
    .then(updated => {
      setTasks(tasks.map(t => t._id === id ? updated : t));
    });
  }

  // Delete a task
  function deleteTask(id) {
    fetch(API_URL + '/' + id, { method: 'DELETE' })
      .then(() => {
        setTasks(tasks.filter(t => t._id !== id));
      });
  }

  // Calculate stats
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'done').length;

  // Render the UI
  return (
    <div className="container">
      <header>
        <h1>My Task Manager</h1>
        <p>Built by me Prabhat Malviya B-tech student</p>
      </header>

      <TaskForm onAdd={addTask} />

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="board">
          <Column 
            title="To Do" 
            status="todo"
            tasks={tasks.filter(t => t.status === 'todo')} 
            onMove={moveTask} 
            onDelete={deleteTask} 
          />
          <Column 
            title="In Progress" 
            status="inprogress"
            tasks={tasks.filter(t => t.status === 'inprogress')} 
            onMove={moveTask} 
            onDelete={deleteTask} 
          />
          <Column 
            title="Done" 
            status="done"
            tasks={tasks.filter(t => t.status === 'done')} 
            onMove={moveTask} 
            onDelete={deleteTask} 
          />
        </div>
      )}

      <footer>
        <p>Total: {total} | Completed: {completed}</p>
      </footer>
    </div>
  );
}