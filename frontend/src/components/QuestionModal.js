import React, { useState } from "react";
import "./QuestionModal.css";

function QuestionModal({ isOpen, onClose, onSubmit }) {
  const [questionData, setQuestionData] = useState({
    title: "",
    body: "",
    tags: ""
  });

  // Handle input changes in the question form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuestionData({
      ...questionData,
      [name]: value
    });
  };

  // Handle question submission
  const handleQuestionSubmit = (e) => {
    e.preventDefault();
    onSubmit(questionData);
    
    // Reset form
    setQuestionData({ title: "", body: "", tags: "" });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="question-modal">
        <div className="modal-header">
          <h2>Ask a Question</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleQuestionSubmit}>
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
            />
          </div>
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
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={questionData.tags}
              onChange={handleInputChange}
              placeholder="Java, Programming, Beginner"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-button">Post Your Question</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuestionModal;
