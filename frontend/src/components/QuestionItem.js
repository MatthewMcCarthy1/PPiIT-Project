import React from "react";
import "./QuestionItem.css";

function QuestionItem({ question }) {
  // Format the date to a more readable format
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

  // Format tags into array 
  const formatTags = (tags) => {
    if (!tags) return [];
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  };

  return (
    <div className="question-item">
      <div className="question-header">
        <h3 className="question-title">{question.title}</h3>
      </div>
      
      <div className="question-excerpt">
        {question.body.length > 200 
          ? `${question.body.substring(0, 200)}...` 
          : question.body}
      </div>
      
      <div className="question-meta">
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
