import React from "react";
import QuestionItem from "./QuestionItem";
import "./Questions.css";

function Questions({ questions, isLoading, error }) {
  // Show loading indicator
  if (isLoading) {
    return (
      <div className="questions-container">
        <div className="questions-loading">
          <i className="fas fa-spinner fa-spin"></i> Loading questions...
        </div>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="questions-container">
        <div className="questions-error">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      </div>
    );
  }

  // Show message when no questions are available
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

  // Render list of questions
  return (
    <div className="questions-container">
      <h2 className="questions-header">
        <i className="fas fa-list-alt"></i> Questions ({questions.length})
      </h2>
      <div className="questions-list">
        {/* Added debugging to verify all questions are in the array */}
        {console.log('Rendering', questions.length, 'questions')}
        
        {/* Map through the full array to render each question */}
        {questions.map((question) => (
          <QuestionItem key={question.id} question={question} />
        ))}
      </div>
    </div>
  );
}

export default Questions;
