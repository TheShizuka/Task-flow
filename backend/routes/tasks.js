const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const router = express.Router();

// @route   POST /api/tasks
// @desc    Create a task
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required').notEmpty(),
      check('title', 'Title cannot exceed 50 characters').isLength({ max: 50 }),
      check('dueDate', 'Due date is required').notEmpty()
    ]
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, description, dueDate } = req.body;

    try {
      // Create new task
      const task = new Task({
        title,
        description: description || '',
        dueDate,
        user: req.user.id
      });

      // Save task to database
      await task.save();

      res.status(201).json(task);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/tasks
// @desc    Get all tasks for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Find all tasks for the user and sort by due date (ascending)
    const tasks = await Task.find({ user: req.user.id }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get a task by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    
    // Check if error is due to invalid ObjectId
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      check('title', 'Title cannot exceed 50 characters').isLength({ max: 50 })
    ]
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, description, dueDate, status } = req.body;

    try {
      // Find task by ID and user ID
      let task = await Task.findOne({ _id: req.params.id, user: req.user.id });
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Update task fields
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (status !== undefined && ['pending', 'completed'].includes(status)) {
        task.status = status;
      }

      // Save updated task
      await task.save();

      res.json(task);
    } catch (err) {
      console.error(err.message);
      
      // Check if error is due to invalid ObjectId
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find task by ID and user ID and delete
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err.message);
    
    // Check if error is due to invalid ObjectId
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/tasks/:id/complete
// @desc    Mark a task as complete
// @access  Private
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    // Find task by ID and user ID
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update task status
    task.status = 'completed';
    
    // Save updated task
    await task.save();

    res.json(task);
  } catch (err) {
    console.error(err.message);
    
    // Check if error is due to invalid ObjectId
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;