import React, { useState, useEffect } from "react";
import "./questions-css/QuestionModal.css";

/**
 * QuestionModal Component
 * 
 * A modal dialog for creating and submitting new questions.
 * Handles form input, validation, and submission states.
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Function to call when closing the modal
 * @param {function} onSubmit - Function to handle form submission
 * @param {Object} submissionStatus - Status of the form submission (success/error)
 * @returns {JSX.Element|null} - Rendered component or null if closed
 */
function QuestionModal({ isOpen, onClose, onSubmit, submissionStatus }) {
  // State for form field values
  const [questionData, setQuestionData] = useState({
    title: "",
    body: "",
    tags: ""
  });
  
  // State to track if form is currently being submitted
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form fields when modal is opened
  useEffect(() => {
    if (isOpen) {
      setQuestionData({ title: "", body: "", tags: "" });
      setIsSubmitting(false);
    }
  }, [isOpen]);

  /**
   * Updates form state when input fields change
   * 
   * @param {Event} e - Input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuestionData({
      ...questionData,
      [name]: value
    });
  };

  /**
   * Handles form submission
   * 
   * @param {Event} e - Form submission event
   */
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Call the onSubmit function passed from HomePage
    await onSubmit(questionData);
    
    // The modal will be closed by HomePage component on success
    setIsSubmitting(false);
  };

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="question-modal">
        {/* Modal header with title and close button */}
        <div className="modal-header">
          <h2>Ask a Question</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {/* Display submission status message if available */}
        {submissionStatus && (
          <div className={`submission-status ${submissionStatus.type}`}>
            {submissionStatus.message}
          </div>
        )}
        
        {/* Question submission form */}
        <form onSubmit={handleQuestionSubmit}>
          {/* Question title field */}
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={questionData.title}
              onChange={handleInputChange}
              placeholder="How do I print 'Hello World' in Java?"
              maxLength="150"
              required
              disabled={isSubmitting}
            />
          </div>
          
          {/* Question body/description field */}
          <div className="form-group">
            <label htmlFor="body">Body</label>
            <textarea
              id="body"
              name="body"
              value={questionData.body}
              onChange={handleInputChange}
              placeholder="New to programming and need help with printing in Java. Tried using print(Hello World) but it doesn't work."
              maxLength="2000"
              rows="8"
              required
              disabled={isSubmitting}
            ></textarea>
          </div>
          
          {/* Question tags field */}
          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={questionData.tags}
              onChange={handleInputChange}
              placeholder="Java, Programming, Beginner"
              disabled={isSubmitting}
            />
          </div>
          
          {/* Form action buttons */}
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Post Your Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuestionModal;
