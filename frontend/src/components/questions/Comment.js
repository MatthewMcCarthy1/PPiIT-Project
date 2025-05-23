import React, { useState } from 'react';
import './questions-css/Comment.css';

/**
 * Comment Component
 * 
 * Displays a single comment with author information and content.
 * Allows authors to delete their own comments with a confirmation modal.
 * 
 * @param {Object} comment - Comment data object containing id, body, user_id, user_email, created_at
 * @param {Object} currentUser - Current logged-in user object with id and other profile information
 * @param {Function} onDelete - Function to call when deleting a comment, accepts comment ID parameter
 * @returns {JSX.Element} - Rendered component
 */
function Comment({ comment, currentUser, onDelete }) {
  // Controls the visibility of the delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Tracks the deletion request state to show loading indicators and disable buttons
  const [isDeleting, setIsDeleting] = useState(false);
  
  /**
   * Formats a date string into a user-friendly format
   * 
   * @param {string} dateString - ISO date string from the API
   * @returns {string} - Formatted date string showing date and time
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
  
  // Check if the current user is the author of the comment
  const isAuthor = currentUser && parseInt(comment.user_id) === parseInt(currentUser.id);
  
  // Open the delete confirmation modal
  const showDeleteConfirmation = () => {
    setShowDeleteModal(true);
  };
  
  // Close the delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };
  
  /**
   * Handles the delete confirmation action
   * 
   * Calls the onDelete function passed as a prop and manages the loading state.
   */
  const confirmDelete = async () => {
    setIsDeleting(true);
    await onDelete(comment.id);
    setIsDeleting(false);
    setShowDeleteModal(false);
  };

  return (
    <>
      <div className="comment">
        <div className="comment-content">{comment.body}</div>
        <div className="comment-meta">
          <div className="comment-author">
            <span className="comment-author-name">{comment.user_email}</span>
            <span className="comment-date">{formatDate(comment.created_at)}</span>
          </div>
          {isAuthor && (
            <button 
              className="delete-comment-btn" 
              onClick={showDeleteConfirmation}
              title="Delete comment"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>
      
      {/* Delete comment confirmation modal */}
      {showDeleteModal && (
        <div className="comment-delete-modal-overlay" onClick={closeDeleteModal}>
          <div className="comment-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="comment-delete-modal-header">
              <h3>Delete Comment</h3>
              <button className="comment-delete-close-button" onClick={closeDeleteModal}>×</button>
            </div>
            
            <div className="comment-delete-modal-content">
              <div className="comment-delete-warning">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <p>Are you sure you want to delete this comment?</p>
              <p className="comment-delete-modal-subtext">This action cannot be undone.</p>
            </div>
            
            <div className="comment-delete-modal-actions">
              <button 
                className="comment-delete-cancel-btn" 
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="comment-delete-confirm-btn" 
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Deleting...
                  </>
                ) : (
                  'Delete Comment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Comment;
