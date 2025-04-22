import React, { useState, useEffect } from "react";
import "./questions-css/QuestionItem.css";
import DeleteConfirmModal from "./DeleteConfirmModal";

/**
 * QuestionItem Component
 * 
 * Displays an individual question with its title, body excerpt, tags, 
 * author information, and creation date.
 * 
 * @param {Object} question - Question object containing all question details
 * @returns {JSX.Element} - Rendered component
 */
function QuestionItem({ question, currentUser, onQuestionDeleted, onQuestionView }) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Check if the current user is the author of the question
  const isAuthor = parseInt(question.user_id) === parseInt(currentUser?.id);
  
  // Check if the question is bookmarked
  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    setIsBookmarked(bookmarks.includes(parseInt(question.id)));
  }, [question.id]);

  /**
   * Formats a date string into a more readable format
   * 
   * @param {string} dateString - ISO date string from database
   * @returns {string} - Formatted date string
   */
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return `Posted on ${new Date(dateString).toLocaleDateString(undefined, options)}`;
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

  // Toggle bookmark
  const toggleBookmark = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const questionId = parseInt(question.id);
    let newBookmarks;
    
    if (isBookmarked) {
      // Remove from bookmarks
      newBookmarks = bookmarks.filter(id => id !== questionId);
    } else {
      // Add to bookmarks
      newBookmarks = [...bookmarks, questionId];
    }
    
    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
    setIsBookmarked(!isBookmarked);
  };

  // Handle click on question item
  const handleQuestionClick = () => {
    // Call the passed handler to show the full question
    if (onQuestionView) {
      onQuestionView(question);
    }
  };

  // Handle deletion of the question
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent opening the question
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  // Confirm deletion
  const confirmDelete = async () => {
    setIsDeleting(true);
    
    try {
      // Get the current hostname from the window location
      const hostname = window.location.hostname;
      const backendUrl = `https://${hostname.replace('-3000', '-8000')}/server.php`;
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'deleteQuestion',
          questionId: question.id,
          userId: currentUser.id
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Notify parent component that this question was deleted
        if (onQuestionDeleted) {
          onQuestionDeleted(question.id);
        }
        // Close the modal
        setShowDeleteModal(false);
      } else {
        alert(data.message || 'Failed to delete question');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="question-item" onClick={handleQuestionClick}>
        {/* Question title with actions */}
        <div className="question-header">
          <h3 className="question-title">{question.title}</h3>
          <div className="question-actions">
            <button 
              className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
              onClick={toggleBookmark}
              title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
            >
              <i className={`${isBookmarked ? 'fas' : 'far'} fa-bookmark`}></i>
            </button>
            
            {isAuthor && (
              <button 
                className="delete-btn" 
                onClick={handleDeleteClick}
                title="Delete this question"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            )}
          </div>
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
            <span>{question.answer_count || 0} answers</span>
          </div>
          <div className="stat-item">
            <i className="far fa-eye"></i>
            <span>{question.views || 0} views</span>
          </div>
          <div className="stat-item view-question">
            <i className="fas fa-external-link-alt"></i>
            <span>View Full Question</span>
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
              <span className="question-date">
                {formatDate(question.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}

export default QuestionItem;
