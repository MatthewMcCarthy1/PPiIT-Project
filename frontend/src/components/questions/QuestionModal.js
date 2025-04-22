import React, { useState, useEffect } from "react";
import "./questions-css/QuestionModal.css";

/**
 * QuestionModal Component
 * 
 * A modal dialog for creating and submitting new questions to the forum.
 * Provides form inputs for question title, body content, and tags.
 * Manages form state, validation, submission process, and feedback display.
 * 
 * @param {boolean} isOpen - Controls whether the modal is visible or hidden
 * @param {function} onClose - Handler to close the modal (cancellation or after submission)
 * @param {function} onSubmit - Handler to process the submitted question data
 * @param {Object} submissionStatus - Object containing submission feedback {type: 'success'|'error', message: string}
 * @returns {JSX.Element|null} - Rendered component or null if modal is closed
 */
function QuestionModal({ isOpen, onClose, onSubmit, submissionStatus }) {
  // Form field values for the question being created
  const [questionData, setQuestionData] = useState({
    title: "",
    body: "",
    tags: ""
  });
  
  // Controls UI elements during submission (disables inputs, changes button text)
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Reset form fields when the modal is opened
   * Prevents old data from appearing in a new question form
   */
  useEffect(() => {
    if (isOpen) {
      setQuestionData({ title: "", body: "", tags: "" });
      setIsSubmitting(false);
    }
  }, [isOpen]);

  /**
   * Updates the question form data when input fields change
   * Uses the field name attribute to determine which property to update
   * 
   * @param {Event} e - Input change event from any form field
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuestionData({
      ...questionData,
      [name]: value
    });
  };

  /**
   * Processes the form submission
   * Prevents default form behavior, sets submission state, and calls the parent handler
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
        
        {/* Status message area - shows success or error messages from submission attempt */}
        {submissionStatus && (
          <div className={`submission-status ${submissionStatus.type}`}>
            {submissionStatus.message}
          </div>
        )}
        
        {/* Question input form with title, body, and tags fields */}
        <form onSubmit={handleQuestionSubmit}>
          {/* Title input - Short, descriptive question summary */}
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
          
          {/* Body input - Detailed question description with context */}
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
          
          {/* Tags input - Comma-separated list of relevant keywords */}
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
          
          {/* Form action buttons for submission or cancellation */}
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
