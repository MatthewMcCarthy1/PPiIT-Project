import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import HomePage from './components/HomePage';

function App() {
  //state to keep track of the user that is logged in
  const [user, setUser] = useState(null);

  return (
    <div className="App">
      {/*conditional rendering based on user authentication state */}
      {!user ? (
        <>
          {/*show Login and Register components if no user is logged in */}
          <Login setUser={setUser} />
          <Register setUser={setUser} />
        </>
      ) : (
        //show HomePage if a user is logged in
        <HomePage user={user} setUser={setUser} />
      )}
    </div>
  );
}

export default App;
