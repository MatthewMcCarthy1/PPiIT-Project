import React from "react";
import "./questions-css/FullQuestionModal.css";

/**
 * Modal to display the full question details
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Function to call when closing the modal
 * @param {Object} question - The complete question data to display
 */
function FullQuestionModal({ isOpen, onClose, question }) {
  if (!isOpen || !question) return null;

  /**
   * Formats a date string into a more readable format
   */
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  /**
   * Converts comma-separated tags string into an array of individual tags
   */
  const formatTags = (tags) => {
    if (!tags) return [];
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  };

  return (
    <div className="full-question-overlay" onClick={onClose}>
      <div className="full-question-modal" onClick={e => e.stopPropagation()}>
        <div className="full-question-header">
          <h2>{question.title}</h2>
          <button className="close-full-question" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="full-question-meta">
          <div className="full-question-author">
            <div className="author-avatar">
              {question.user_email ? question.user_email.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="author-info">
              <span className="author-name">{question.user_email}</span>
              <span className="post-date">Posted on {formatDate(question.created_at)}</span>
            </div>
          </div>
        </div>
        
        <div className="full-question-content">
          <div className="question-body">
            {question.body}
          </div>
          
          <div className="full-question-tags">
            {formatTags(question.tags).length > 0 ? (
              <>
                <span className="tags-label">Tags:</span>
                <div className="tags-container">
                  {formatTags(question.tags).map((tag, index) => (
                    <span key={index} className="question-tag">{tag}</span>
                  ))}
                </div>
              </>
            ) : (
              <span className="no-tags">No tags</span>
            )}
          </div>
        </div>
        
        <div className="answers-section">
          <h3 className="answers-header">
            <i className="fas fa-comment-alt"></i> Answers (0)
          </h3>
          
          <div className="no-answers">
            <i className="fas fa-comments"></i>
            <p>No answers yet. Be the first to answer this question!</p>
          </div>
          
          {/* Answer form and list of answers */}
          <div className="answer-form-placeholder">
            <textarea 
              placeholder="Write your answer here..." 
              className="answer-input"
              disabled
            ></textarea>
            <button className="post-answer-btn" disabled>
              Post Your Answer <small>(Coming soon)</small>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FullQuestionModal;
