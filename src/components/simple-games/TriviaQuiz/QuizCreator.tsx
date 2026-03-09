import React, { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { CustomQuiz, Question } from './TriviaQuiz';
import { nanoid } from 'nanoid';

interface QuizCreatorProps {
  userEmail: string;
  partnerEmail: string;
  onSave: (quiz: CustomQuiz) => void;
  onCancel: () => void;
  editingQuiz?: CustomQuiz | null;
}

export const QuizCreator: React.FC<QuizCreatorProps> = ({
  userEmail,
  partnerEmail,
  onSave,
  onCancel,
  editingQuiz
}) => {
  const [title, setTitle] = useState(editingQuiz?.title || '');
  const [description, setDescription] = useState(editingQuiz?.description || '');
  const [category, setCategory] = useState(editingQuiz?.category || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(editingQuiz?.difficulty || 'medium');
  const [questions, setQuestions] = useState<Question[]>(editingQuiz?.questions || [{
    id: nanoid(),
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  }]);

  const addQuestion = () => {
    setQuestions([...questions, {
      id: nanoid(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const handleSave = () => {
    // Validation
    if (!title.trim()) {
      alert('Please enter a quiz title');
      return;
    }
    if (!category.trim()) {
      alert('Please enter a category');
      return;
    }
    if (questions.length < 3) {
      alert('Please add at least 3 questions');
      return;
    }
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Question ${i + 1} is empty`);
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        alert(`Question ${i + 1} has empty options`);
        return;
      }
    }

    const quiz: CustomQuiz = {
      id: editingQuiz?.id || nanoid(),
      title,
      description,
      category,
      difficulty,
      questions,
      createdBy: userEmail,
      createdFor: partnerEmail,
      createdAt: editingQuiz?.createdAt || Date.now()
    };

    onSave(quiz);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {editingQuiz ? 'Edit Quiz' : 'Create Quiz'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Creating for: {partnerEmail}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Quiz Details */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Quiz Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., How Well Do You Know Me?"
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-indigo-600 focus:outline-none dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Test your knowledge about our relationship!"
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-indigo-600 focus:outline-none dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Our Relationship"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-indigo-600 focus:outline-none dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-indigo-600 focus:outline-none dark:bg-gray-800 dark:text-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Questions ({questions.length})
            </h2>
            <button
              onClick={addQuestion}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>

          {questions.map((question, qIndex) => (
            <div key={question.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Question {qIndex + 1}
                </h3>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Question Text *
                  </label>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                    placeholder="e.g., What's my favorite color?"
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-indigo-600 focus:outline-none dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Options * (Select the correct answer)
                  </label>
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correctAnswer === oIndex}
                          onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                          className="w-4 h-4"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                          className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-indigo-600 focus:outline-none dark:bg-gray-900 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Explanation (Optional)
                  </label>
                  <input
                    type="text"
                    value={question.explanation}
                    onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                    placeholder="e.g., Because we saw this together on our first date!"
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-indigo-600 focus:outline-none dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Quiz
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-4 bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
          * Required fields. Minimum 3 questions needed.
        </p>
      </div>
    </div>
  );
};