import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Form, Modal, Container, Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { getTasks, createTask, updateTask, deleteTask, completeTask } from '../api';
import { FaEdit, FaTrash, FaCheck, FaCalendarAlt, FaTasks, FaListAlt } from 'react-icons/fa'; 
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [taskData, setTaskData] = useState({ title: '', description: '', dueDate: '' });
  const [editTaskId, setEditTaskId] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showCompleteConfirmation, setShowCompleteConfirmation] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [taskToComplete, setTaskToComplete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // Default to card view for all devices
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isMountedRef = useRef(true);
  const fetchedRef = useRef(false);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Fetch tasks when component mounts or theme changes
  useEffect(() => {
    if (!user || !isMountedRef.current) {
      return;
    }
    
    const fetchTasks = async () => {
      try {
        if (!fetchedRef.current) {
          fetchedRef.current = true;
        } else {
          // Skip loading indicator on theme change if we already have tasks
          if (tasks.length > 0) {
            return;
          }
        }
        
        setLoading(true);
        const response = await getTasks();
        
        if (isMountedRef.current) {
          setTasks(response.data);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
        
        if (isMountedRef.current) {
          if (err.response?.status === 401) {
            navigate('/login');
          } else {
            setError('Unable to load tasks. Please try again later.');
            setLoading(false);
          }
        }
      }
    };

    fetchTasks();
  }, [user, navigate, theme]); // Added theme as dependency

  // Handle retry button click
  const handleRetry = async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await getTasks();
      
      if (isMountedRef.current) {
        setTasks(response.data);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error during retry:', err);
      
      if (isMountedRef.current) {
        setError('Unable to load tasks. Please try again later.');
        setLoading(false);
      }
    }
  };

  // Toggle description expansion
  const toggleDescription = (id) => {
    if (!isMountedRef.current) return;
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Open modal for editing a task
  const handleEdit = (task) => {
    if (!isMountedRef.current) return;
    const formattedDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
    setTaskData({ 
      title: task.title, 
      description: task.description || '', 
      dueDate: formattedDate
    });
    setEditTaskId(task._id);
    setShowModal(true);
  };
  
  // Handle task creation or update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isMountedRef.current) return;
    
    if (taskData.title.length > 50) {
      alert('Title must be 50 characters or less.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (editTaskId) {
        await updateTask(editTaskId, taskData);
      } else {
        await createTask(taskData);
      }
      
      if (isMountedRef.current) {
        setShowModal(false);
        setTaskData({ title: '', description: '', dueDate: '' });
        setEditTaskId(null);
        
        // Fetch updated tasks
        const response = await getTasks();
        setTasks(response.data);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error:', err);
      
      if (isMountedRef.current) {
        setError('Error saving task. Please try again.');
        setLoading(false);
      }
    }
  };

  // Handle task deletion
  const handleDelete = async (id) => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await deleteTask(id);
      
      if (isMountedRef.current) {
        const response = await getTasks();
        setTasks(response.data);
        setShowDeleteConfirmation(false);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error:', err);
      
      if (isMountedRef.current) {
        setError('Error deleting task. Please try again.');
        setLoading(false);
      }
    }
  };

  // Mark a task as complete
  const handleComplete = async (id) => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await completeTask(id);
      
      if (isMountedRef.current) {
        const response = await getTasks();
        setTasks(response.data);
        setShowCompleteConfirmation(false);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error:', err);
      
      if (isMountedRef.current) {
        setError('Error completing task. Please try again.');
        setLoading(false);
      }
    }
  };

  // Handle opening the create task modal
  const handleOpenCreateModal = () => {
    if (!isMountedRef.current) return;
    setTaskData({ title: '', description: '', dueDate: '' });
    setEditTaskId(null);
    setShowModal(true);
  };
  
  // Render tasks in card view
  const renderCardView = () => {
    if (tasks.length === 0) {
      return (
        <Card className="text-center p-4 mb-3">
          <Card.Body>
            <h4>No tasks found</h4>
            <p>Create your first task to get started</p>
          </Card.Body>
        </Card>
      );
    }
    
    return (
      <Row xs={1} md={2} lg={3} className="g-4">
        {tasks.map((task) => (
          <Col key={task._id}>
            <Card className="h-100 task-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 task-title">{task.title}</h5>
                <Badge bg={task.status === 'completed' ? 'success' : 'warning'}>
                  {task.status}
                </Badge>
              </Card.Header>
              <Card.Body>
                <div 
                  className={`task-description ${expandedDescriptions[task._id] ? 'expanded' : ''}`}
                  onClick={() => toggleDescription(task._id)}
                >
                  {task.description || <em>No description</em>}
                </div>
                
                {task.dueDate && (
                  <div className="mt-3 text-muted">
                    <FaCalendarAlt className="me-2" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
              </Card.Body>
              <Card.Footer className="d-flex justify-content-between">
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={() => handleEdit(task)}
                >
                  <FaEdit className="me-1" /> Edit
                </Button>
                
                <Button 
                  variant="outline-success" 
                  size="sm" 
                  onClick={() => {
                    setTaskToComplete(task._id);
                    setShowCompleteConfirmation(true);
                  }}
                  disabled={task.status === 'completed'}
                >
                  <FaCheck className="me-1" /> Complete
                </Button>
                
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  onClick={() => {
                    setTaskToDelete(task._id);
                    setShowDeleteConfirmation(true);
                  }}
                >
                  <FaTrash className="me-1" /> Delete
                </Button>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };
  
  // Render tasks in table view (for reference, not used by default)
  const renderTableView = () => {
    if (tasks.length === 0) {
      return (
        <Card className="text-center p-5">
          <Card.Body>
            <h4>No tasks found</h4>
            <p>Create your first task to get started</p>
          </Card.Body>
        </Card>
      );
    }
    
    return (
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task._id}>
                <td>{task.title}</td>
                <td style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                  <div
                    className={`task-description ${expandedDescriptions[task._id] ? 'expanded' : ''}`}
                    onClick={() => toggleDescription(task._id)}
                  >
                    {task.description || <em>No description</em>}
                  </div>
                </td>
                <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</td>
                <td>
                  <Badge bg={task.status === 'completed' ? 'success' : 'warning'}>
                    {task.status}
                  </Badge>
                </td>
                <td className="actions">
                  <button className="icon-button edit" onClick={() => handleEdit(task)}>
                    <FaEdit />
                  </button>
                  <button
                    className="icon-button complete"
                    onClick={() => {
                      setTaskToComplete(task._id);
                      setShowCompleteConfirmation(true);
                    }}
                    disabled={task.status === 'completed'}
                  >
                    <FaCheck />
                  </button>
                  <button
                    className="icon-button delete"
                    onClick={() => {
                      setTaskToDelete(task._id);
                      setShowDeleteConfirmation(true);
                    }}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };
  
  // Toggle between card and table view
  const toggleViewMode = () => {
    setViewMode(viewMode === 'card' ? 'table' : 'card');
  };
  
  return (
    <Container className="mt-5">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2>Dashboard</h2>
        </Col>
        <Col className="text-end">
          <div className="d-flex justify-content-end gap-2">
            <Button 
              variant="outline-secondary"
              onClick={toggleViewMode}
              className="me-2 d-none d-md-inline-flex" // Only show on desktop
              title={viewMode === 'card' ? 'Switch to table view' : 'Switch to card view'}
            >
              {viewMode === 'card' ? <FaListAlt /> : <FaTasks />}
            </Button>
            <Button 
              onClick={handleOpenCreateModal}
              disabled={loading}
            >
              Create Task
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={handleRetry}
            disabled={loading}
          >
            Retry
          </Button>
        </Alert>
      )}

      {loading && (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading tasks...</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {viewMode === 'card' ? renderCardView() : renderTableView()}
        </>
      )}

      {/* Task Creation/Update Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editTaskId ? 'Edit Task' : 'Create Task'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title (max 50 characters)</Form.Label>
              <Form.Control
                type="text"
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                maxLength={50}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="date"
                value={taskData.dueDate}
                onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
              />
            </Form.Group>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" /> : 'Save'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirmation} onHide={() => setShowDeleteConfirmation(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this task?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirmation(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => handleDelete(taskToDelete)} disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" /> : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Complete Confirmation Modal */}
      <Modal show={showCompleteConfirmation} onHide={() => setShowCompleteConfirmation(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Complete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to mark this task as complete?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCompleteConfirmation(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={() => handleComplete(taskToComplete)} disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" /> : 'Complete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Dashboard;