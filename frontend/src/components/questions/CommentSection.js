import React, { useState, useEffect } from 'react';
import Comment from './Comment';
import './questions-css/CommentSection.css';

/**
 * Comment Section Component
 * 
 * Displays comments for answers and provides a form to add new comments
 * 
 * @param {number} answerId - ID of the answer
 * @param {Object} currentUser - Current logged-in user
 * @returns {JSX.Element} - Rendered component
 */
function CommentSection({ answerId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  
  // Fetch comments when component mounts or answerId changes
  useEffect(() => {
    fetchComments();
  }, [answerId]);
  
  // Fetch comments from the server
  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const hostname = window.location.hostname;
      const backendUrl = `https://${hostname.replace('-3000', '-8000')}/server.php`;
      
      const response = await fetch(`${backendUrl}?action=getComments&answerId=${answerId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setComments(data.comments || []);
      } else {
        setError(data.message || 'Failed to load comments');
      }
    } catch (error) {
      setError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Submit a new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    if (!currentUser) {
      alert('Please log in to add a comment');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const hostname = window.location.hostname;
      const backendUrl = `https://${hostname.replace('-3000', '-8000')}/server.php`;
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'addComment',
          userId: currentUser.id,
          answerId: answerId,
          body: newComment.trim()
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add the new comment to the list
        setComments(prevComments => [...prevComments, data.comment]);
        setNewComment(''); // Clear input
        // Expand comments if they were collapsed
        if (!commentsExpanded) {
          setCommentsExpanded(true);
        }
      } else {
        alert(data.message || 'Failed to add comment');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete a comment
  const handleDeleteComment = async (commentId) => {
    try {
      const hostname = window.location.hostname;
      const backendUrl = `https://${hostname.replace('-3000', '-8000')}/server.php`;
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'deleteComment',
          commentId: commentId,
          userId: currentUser.id
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the deleted comment from the list
        setComments(prevComments => prevComments.filter(c => c.id !== commentId));
      } else {
        alert(data.message || 'Failed to delete comment');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };
  
  // Toggle comments section visibility
  const toggleComments = () => {
    setCommentsExpanded(!commentsExpanded);
  };
  
  // Content for the toggle button
  const toggleButtonText = commentsExpanded 
    ? `Hide comments (${comments.length})` 
    : `Show comments (${comments.length})`;
  
  return (
    <div className="comments-section">
      {/* Comment toggle button (only shown if there are comments) */}
      {comments.length > 0 && (
        <button 
          className="toggle-comments-btn"
          onClick={toggleComments}
        >
          <i className={`fas fa-chevron-${commentsExpanded ? 'up' : 'down'}`}></i>
          {toggleButtonText}
        </button>
      )}
      
      {/* Show comments when expanded or when there are no comments yet */}
      {(commentsExpanded || comments.length === 0) && (
        <>
          {/* Comments list */}
          <div className="comments-list">
            {isLoading && (
              <div className="comments-loading">Loading comments...</div>
            )}
            
            {error && !isLoading && (
              <div className="comments-error">{error}</div>
            )}
            
            {!isLoading && !error && comments.length === 0 && (
              <div className="no-comments">No comments yet</div>
            )}
            
            {!isLoading && !error && comments.map(comment => (
              <Comment
                key={comment.id}
                comment={comment}
                currentUser={currentUser}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>
          
          {/* Add comment form */}
          {currentUser && (
            <form className="add-comment-form" onSubmit={handleSubmitComment}>
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength="500"
                disabled={isSubmitting}
              />
              <button 
                type="submit" 
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </form>
          )}
          
          {!currentUser && (
            <div className="login-to-comment">
              <i className="fas fa-info-circle"></i> Log in to add a comment
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CommentSection;
