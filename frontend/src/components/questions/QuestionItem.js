import React, { useState, useEffect } from "react";
import "./questions-css/QuestionItem.css";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { API_BASE_URL } from "../../config"; // Importing API base URL from config

/**
 * QuestionItem Component
 * 
 * Displays an individual question in a list format with interactive elements.
 * Features include question preview, tags, bookmarking, deletion (for authors),
 * and statistics like answer count and views.
 * 
 * @param {Object} question - Question object containing id, title, body, tags, user_id, etc.
 * @param {Object} currentUser - Currently logged-in user object (null if not logged in)
 * @param {Function} onQuestionDeleted - Callback function invoked after successful question deletion
 * @param {Function} onQuestionView - Callback function to handle clicking on a question to view details
 * @returns {JSX.Element} - Rendered component
 */
function QuestionItem({ question, currentUser, onQuestionDeleted, onQuestionView }) {
  // Tracks whether the current question is bookmarked by the user
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Controls visibility of the delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Tracks the progress of a deletion operation for UI feedback
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Determines if the current user is the author of the question for permission checks
  const isAuthor = parseInt(question.user_id) === parseInt(currentUser?.id);
  
  /**
   * Check local storage to determine if this question is bookmarked
   * Updates the bookmark state whenever the question ID changes
   */
  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    setIsBookmarked(bookmarks.includes(parseInt(question.id)));
  }, [question.id]);

  /**
   * Formats a date string into a more readable format
   * 
   * @param {string} dateString - ISO date string from database
   * @returns {string} - Formatted date string with "Posted on" prefix
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
   * Filters out empty tags and trims whitespace
   * 
   * @param {string} tags - Comma-separated tag string
   * @returns {Array} - Array of individual tag strings
   */
  const formatTags = (tags) => {
    if (!tags) return [];
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  };

  /**
   * Toggles the bookmark status of the question
   * Updates both the local state and localStorage
   * 
   * @param {Event} e - Click event object
   */
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

  /**
   * Handles clicks on the question item to view the full question
   * Calls the onQuestionView callback with the question object
   */
  const handleQuestionClick = () => {
    // Call the passed handler to show the full question
    if (onQuestionView) {
      onQuestionView(question);
    }
  };

  /**
   * Opens the delete confirmation modal
   * Stops event propagation to prevent opening the question
   * 
   * @param {Event} e - Click event object
   */
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent opening the question
    setShowDeleteModal(true);
  };

  /**
   * Closes the delete confirmation modal without taking action
   */
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  /**
   * Sends delete request to the server after confirmation
   * Updates UI state during the process and handles success/failure
   */
  const confirmDelete = async () => {
    setIsDeleting(true);
    
    try {
      const backendUrl = API_BASE_URL;
      
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
      {/* Question card - clickable to view full question */}
      <div className="question-item" onClick={handleQuestionClick}>
        {/* Question header containing title and action buttons (bookmark/delete) */}
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
        
        {/* Question body preview - truncated with ellipsis if too long */}
        <div className="question-excerpt">
          {question.body.length > 200 
            ? `${question.body.substring(0, 200)}...` 
            : question.body}
        </div>
        
        {/* Question statistics section showing answer count, views and link */}
        <div className="question-stats">
          <div className="stat-item">
            <i className={`${parseInt(question.has_accepted_answer) === 1 ? 'fas fa-check-circle accepted-indicator' : 'far fa-comment-alt'}`}></i>
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
        
        {/* Question metadata section with tags and author information */}
        <div className="question-meta">
          {/* Tags display area */}
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
          
          {/* Author information with avatar and details */}
          <div className="question-info">
            {/* Simple avatar using first letter of email */}
            <div className="user-avatar">
              {question.user_email ? question.user_email.charAt(0).toUpperCase() : '?'}
            </div>
            {/* Author email and posting date */}
            <div className="user-details">
              <span className="question-author">{question.user_email}</span>
              <span className="question-date">
                {formatDate(question.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal - only rendered when showDeleteModal is true */}
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
