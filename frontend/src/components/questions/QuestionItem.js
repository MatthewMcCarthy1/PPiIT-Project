import React from "react";
import "./questions-css/QuestionItem.css";

/**
 * QuestionItem Component
 * 
 * Displays an individual question with its title, body excerpt, tags, 
 * author information, and creation date.
 * 
 * @param {Object} question - Question object containing all question details
 * @returns {JSX.Element} - Rendered component
 */
function QuestionItem({ question }) {
  /**
   * Formats a date string into a more readable format
   * 
   * @param {string} dateString - ISO date string from database
   * @returns {string} - Formatted date string
   */
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  /**
   * Converts comma-separated tags string into an array of individual tags
   * 
   * @param {string} tags - Comma-separated tag string
   * @returns {Array} - Array of individual tag strings
   */
  const formatTags = (tags) => {
    if (!tags) return [];
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  };

  return (
    <div className="question-item">
      {/* Question title */}
      <div className="question-header">
        <h3 className="question-title">{question.title}</h3>
      </div>
      
      {/* Question body preview - truncated to 200 characters if longer */}
      <div className="question-excerpt">
        {question.body.length > 200 
          ? `${question.body.substring(0, 200)}...` 
          : question.body}
      </div>
      
      {/* Question metadata: tags, author, and date */}
      <div className="question-meta">
        {/* Tags section */}
        <div className="question-tags-container">
          <span className="tags-label">Tags:</span>
          <div className="question-tags">
            {formatTags(question.tags).length > 0 ? (
              formatTags(question.tags).map((tag, index) => (
                <span key={index} className="question-tag">{tag}</span>
              ))
            ) : (
              <span className="no-tags">No tags</span>
            )}
          </div>
        </div>
        
        {/* Author and date information */}
        <div className="question-info">
          <span className="question-author">
            <i className="fas fa-user"></i> {question.user_email}
          </span>
          <span className="question-date">
            <i className="far fa-clock"></i> {formatDate(question.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default QuestionItem;
