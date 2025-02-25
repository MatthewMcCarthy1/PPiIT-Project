import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import HomePage from "./components/HomePage";
import './App.css'

function App() {
  // State to keep track of the user that is logged in
  const [user, setUser] = useState(null);

  const [isLoginActive, setIsLoginActive] = useState(true);

  // Effect to check for a stored user in localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Function to set the user and store in localStorage
  const handleSetUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const toggleAuth = () => {
    setIsLoginActive(!isLoginActive);
  };

  if (user) {
    return <HomePage user={user} setUser={setUser} />;
  }

  return (
    <div className="auth-container">
      <div className="auth-header-container">
        <h1 className="auth-header">Welcome to UniStack</h1>
      </div>
      <div className={`auth-box ${isLoginActive ? 'login-active' : ''}`}>
        <div className="auth-form register-form">
          <Register setUser={handleSetUser} />
        </div>
        <div className="auth-form login-form">
          <Login setUser={handleSetUser} />
        </div>
        <div className="slider">
          <div className="slider-text">
            {isLoginActive ? (
              <>
                <h2>New Here?</h2>
                <p>Sign up now to access </p>
                <button onClick={toggleAuth}>Sign Up</button>
              </>
            ) : (
              <>
                <h2>Welcome Back!</h2>
                <p>Login to access your account</p>
                <button onClick={toggleAuth}>Sign In</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
