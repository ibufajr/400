const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Get categories endpoint
app.get('/api/categories', async (req, res) => {
  try {
    const questionsDir = path.join(__dirname, 'data', 'questions');
    await fs.mkdir(questionsDir, { recursive: true });
    
    const items = await fs.readdir(questionsDir, { withFileTypes: true });
    const categories = items
      .filter(item => item.isFile() && item.name.endsWith('.json'))
      .map(item => item.name.replace('.json', ''));
    
    res.json(categories);
  } catch (error) {
    console.error('Error loading categories:', error);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// Create category endpoint
app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const categoryDir = path.join(__dirname, 'questions', name);
    
    try {
      await fs.access(categoryDir);
      return res.status(409).json({ error: 'Category already exists' });
    } catch (err) {
      // Directory doesn't exist, we can proceed
    }

    await fs.mkdir(categoryDir, { recursive: true });
    
    // Create an empty questions.txt file
    const questionsFile = path.join(categoryDir, 'questions.txt');
    await fs.writeFile(questionsFile, '', 'utf8');
    
    res.status(201).json({ message: 'Category created successfully' });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Get questions for a category endpoint
app.get('/api/questions/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const questionsPath = path.join(__dirname, 'data', 'questions', 'easy', `${category}.json`);
    
    if (!fs.existsSync(questionsPath)) {
      return res.status(404).json({ error: 'الفئة غير موجودة' });
    }

    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

    res.json(questions);
  } catch (error) {
    console.error('Error loading questions:', error);
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});