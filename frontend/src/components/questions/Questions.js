import React from "react";
import QuestionItem from "./QuestionItem";
import "./Questions.css";

/**
 * Questions Component
 * 
 * Responsible for displaying a list of questions fetched from the backend.
 * Handles three states: loading, error, and displaying questions.
 * 
 * @param {Array} questions - Array of question objects to display
 * @param {boolean} isLoading - Flag indicating if questions are currently being fetched
 * @param {string} error - Error message if question fetching failed
 * @returns {JSX.Element} - Rendered component
 */
function Questions({ questions, isLoading, error }) {
  // Show loading indicator when questions are being fetched
  if (isLoading) {
    return (
      <div className="questions-container">
        <div className="questions-loading">
          <i className="fas fa-spinner fa-spin"></i> Loading questions...
        </div>
      </div>
    );
  }

  // Show error message if questions fetching failed
  if (error) {
    return (
      <div className="questions-container">
        <div className="questions-error">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      </div>
    );
  }

  // Show message when no questions are available in the database
  if (!questions || questions.length === 0) {
    return (
      <div className="questions-container">
        <div className="no-questions">
          <i className="fas fa-question-circle"></i>
          <h3>No questions yet</h3>
          <p>Be the first to ask a question using the "Ask Question" button!</p>
        </div>
      </div>
    );
  }

  // Render list of questions when available
  return (
    <div className="questions-container">
      <h2 className="questions-header">
        <i className="fas fa-list-alt"></i> Questions ({questions.length})
      </h2>
      <div className="questions-list">
        {/* Log the number of questions being rendered for debugging */}
        {console.log('Rendering', questions.length, 'questions')}
        
        {/* Map through the questions array to create a QuestionItem component for each */}
        {questions.map((question) => (
          <QuestionItem key={question.id} question={question} />
        ))}
      </div>
    </div>
  );
}

export default Questions;
