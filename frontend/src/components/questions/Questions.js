import React from "react";
import QuestionItem from "./QuestionItem";
import "./questions-css/Questions.css";

/**
 * Questions Component
 * 
 * Responsible for displaying a list of questions fetched from the backend.
 * Handles three states: loading, error, and displaying questions.
 * 
 * @param {Array} questions - Array of question objects to display
 * @param {number} allQuestionsCount - Total number of questions available
 * @param {boolean} isLoading - Flag indicating if questions are currently being fetched
 * @param {string} error - Error message if question fetching failed
 * @param {string} searchQuery - Search query string
 * @param {string} searchInput - User input for search
 * @param {string} activeView - Current active view
 * @param {object} currentUser - Current logged-in user
 * @param {function} onQuestionDeleted - Handler for question deletion
 * @param {function} onQuestionView - Handler for question view
 * @returns {JSX.Element} - Rendered component
 */
function Questions({ 
  questions, 
  allQuestionsCount, 
  isLoading, 
  error, 
  searchQuery, 
  searchInput, 
  activeView, 
  currentUser,
  onQuestionDeleted,
  onQuestionView
}) {
  // Show loading indicator when questions are being fetched
  if (isLoading) {
    return (
      <div className="questions-container">
        <div className="questions-loading">
          <div className="spinner"></div>
          <span>Loading questions...</span>
        </div>
      </div>
    );
  }

  // Show error message if questions fetching failed
  if (error) {
    return (
      <div className="questions-container">
        <div className="questions-error">
          <i className="fas fa-exclamation-circle"></i> 
          <div>
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Special case for search with no results
  if (searchInput && questions.length === 0 && allQuestionsCount > 0) {
    return (
      <div className="questions-container">
        <div className="no-search-results">
          <i className="fas fa-search"></i>
          <h3>No matching questions found</h3>
          <p>We couldn't find any questions matching "{searchInput}"</p>
          <p className="search-suggestion">Try different keywords or check for typos</p>
        </div>
      </div>
    );
  }

  // Show empty state messages specific to the current view
  if (!questions || questions.length === 0) {
    let message = "No questions yet";
    let description = "Be the first to ask a question using the \"Ask Question\" button!";
    let icon = "fa-question-circle";
    
    if (searchQuery) {
      message = "No matching questions found";
      description = `We couldn't find any questions matching "${searchQuery}". Try a different search term.`;
      icon = "fa-search";
    } else if (activeView === "myquestions") {
      message = "You haven't asked any questions yet";
      description = "Click on \"Ask Question\" to post your first question!";
      icon = "fa-pen";
    } else if (activeView === "bookmarks") {
      message = "No bookmarked questions";
      description = "Bookmark interesting questions to find them easily later.";
      icon = "fa-bookmark";
    }
    
    return (
      <div className="questions-container">
        <div className="no-questions">
          <i className={`fas ${icon}`}></i>
          <h3>{message}</h3>
          <p>{description}</p>
          <div className="empty-state-illustration"></div>
        </div>
      </div>
    );
  }

  // Render header text based on active view
  let headerText = "Recent Questions";
  if (activeView === "myquestions") {
    headerText = "My Questions";
  } else if (activeView === "bookmarks") {
    headerText = "Bookmarked Questions";
  } else if (searchQuery) {
    headerText = "Search Results";
  }

  // Render list of questions when available
  return (
    <div className="questions-container">
      <h2 className="questions-header">
        <i className="fas fa-list-alt"></i> {headerText}
        <span className="questions-count">{questions.length}</span>
      </h2>
      <div className="questions-list">
        {questions.map((question) => (
          <QuestionItem 
            key={question.id} 
            question={question} 
            currentUser={currentUser}
            onQuestionDeleted={onQuestionDeleted}
            onQuestionView={onQuestionView}
          />
        ))}
      </div>
    </div>
  );
}

export default Questions;
