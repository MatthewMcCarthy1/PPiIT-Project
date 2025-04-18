import React from "react";
import "./questions-css/DeleteConfirmModal.css";

/**
 * Modal dialog to confirm question deletion
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Function to call when closing the modal
 * @param {function} onConfirm - Function to call when confirming deletion
 * @param {boolean} isDeleting - Whether deletion is in progress
 */
function DeleteConfirmModal({ isOpen, onClose, onConfirm, isDeleting }) {
  if (!isOpen) return null;

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-header">
          <h3>Delete Question</h3>
          <button className="delete-close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="delete-modal-content">
          <div className="delete-warning">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <p>Are you sure you want to delete this question?</p>
          <p className="delete-modal-subtext">This action cannot be undone.</p>
        </div>
        
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
