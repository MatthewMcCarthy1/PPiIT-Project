import React from "react";
import "./questions-css/DeleteConfirmModal.css";

/**
 * Delete Confirmation Modal Component
 * 
 * Displays a modal dialog that asks the user to confirm question deletion.
 * Features a warning message, cancel and confirm buttons, and loading state.
 * The modal can be closed by clicking outside it or the close button.
 * 
 * @param {boolean} isOpen - Controls whether the modal is visible or hidden
 * @param {function} onClose - Handler called when the modal should close (cancel button or overlay click)
 * @param {function} onConfirm - Handler called when user confirms the deletion action
 * @param {boolean} isDeleting - Indicates whether deletion is currently in progress (for UI feedback)
 * @returns {JSX.Element|null} - Modal component or null if not open
 */
function DeleteConfirmModal({ isOpen, onClose, onConfirm, isDeleting }) {
  // Don't render anything if the modal isn't open
  if (!isOpen) return null;

  return (
    // Overlay covers the entire screen with semi-transparent background
    // Clicking the overlay closes the modal (simulates clicking Cancel)
    <div className="delete-modal-overlay" onClick={onClose}>
      {/* Modal container - stop propagation to prevent closing when clicking inside the modal */}
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header section with title and close button */}
        <div className="delete-modal-header">
          <h3>Delete Question</h3>
          <button className="delete-close-button" onClick={onClose}>×</button>
        </div>
        
        {/* Content section with warning icon and message */}
        <div className="delete-modal-content">
          <div className="delete-warning">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <p>Are you sure you want to delete this question?</p>
          <p className="delete-modal-subtext">This action cannot be undone.</p>
        </div>
        
        {/* Action buttons - Cancel and Delete */}
        <div className="delete-modal-actions">
          <button 
            className="delete-cancel-btn" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button 
            className="delete-confirm-btn" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Deleting...
              </>
            ) : (
              'Delete Question'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
