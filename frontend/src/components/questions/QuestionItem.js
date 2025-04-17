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
   * Calculates time elapsed since question was posted
   * 
   * @param {string} dateString - ISO date string from database
   * @returns {string} - Human readable time elapsed
   */
  const getTimeElapsed = (dateString) => {
    const now = new Date();
    const postedDate = new Date(dateString);
    const seconds = Math.floor((now - postedDate) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return interval === 1 ? "1 year ago" : `${interval} years ago`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return interval === 1 ? "1 month ago" : `${interval} months ago`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return interval === 1 ? "1 day ago" : `${interval} days ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return interval === 1 ? "1 hour ago" : `${interval} hours ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return interval === 1 ? "1 minute ago" : `${interval} minutes ago`;
    }
    
    return "just now";
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
      
      {/* Question stats section */}
      <div className="question-stats">
        <div className="stat-item">
          <i className="far fa-comment-alt"></i>
          <span>0 answers</span>
        </div>
        <div className="stat-item">
          <i className="far fa-eye"></i>
          <span>0 views</span>
        </div>
      </div>
      
      {/* Question metadata: tags, author, and date */}
      <div className="question-meta">
        {/* Tags section */}
        <div className="question-tags-container">
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
          <div className="user-avatar">
            {question.user_email ? question.user_email.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="user-details">
            <span className="question-author">{question.user_email}</span>
            <span className="question-date" title={formatDate(question.created_at)}>
              {getTimeElapsed(question.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestionItem;
