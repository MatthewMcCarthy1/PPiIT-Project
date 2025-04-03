<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Credentials: true");
    exit(0);
}

// Add CORS headers to all responses
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

try {
    // Connect to the MySQL database
    $conn = new mysqli("mysql", "root", "root", "ppiitprojectdb");

    // Check connection
    if ($conn->connect_error) {
        die(json_encode(["success" => false, "message" => "Database connection failed"]));
    }

    // Handle GET requests separately
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (isset($_GET['action']) && $_GET['action'] === 'getQuestions') {
            getQuestions($conn);
            exit;
        }
    }

    // Decode the JSON data sent from the client
    $data = json_decode(file_get_contents("php://input"));

    if (json_last_error() !== JSON_ERROR_NONE) {
        die(json_encode(["success" => false, "message" => "Invalid request format"]));
    }

    // Check if an action is specified in the request
    if (isset($data->action)) {
        switch ($data->action) {
            case 'login':
                login($conn, $data);
                break;
            case 'register':
                register($conn, $data);
                break;
            case 'submitQuestion':
                submitQuestion($conn, $data);
                break;
            default:
                echo json_encode(["success" => false, "message" => "Invalid action"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "No action specified"]);
    }

    // Close the database connection
    $conn->close();
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Server error"]);
}

// Function to get all questions
function getQuestions($conn) {
    // Prepare SQL query to get questions with user email
    $sql = "SELECT q.*, u.email as user_email 
            FROM questions q 
            JOIN users u ON q.user_id = u.id 
            ORDER BY q.created_at DESC";
    
    $result = $conn->query($sql);
    
    if ($result === false) {
        echo json_encode([
            "success" => false, 
            "message" => "Error retrieving questions: " . $conn->error
        ]);
        return;
    }
    
    $questions = [];
    $count = 0;
    
    // Collect all questions from the result set
    while ($row = $result->fetch_assoc()) {
        $questions[] = $row;
        $count++;
    }
    
    // Include count for debugging
    echo json_encode([
        "success" => true,
        "count" => $count,
        "questions" => $questions
    ]);
}

// Function to handle user login
function login($conn, $data)
{
    $email = $data->email;
    $password = $data->password;

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["success" => false, "message" => "Invalid email format"]);
        return;
    }

    // Prepare and execute a SQL query to find the user
    $stmt = $conn->prepare("SELECT id, email, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        // Verify the password
        if (password_verify($password, $user['password'])) {
            echo json_encode(["success" => true, "user" => ["id" => $user['id'], "email" => $user['email']]]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid password"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "User not found"]);
    }
}

// Function to handle user registration
function register($conn, $data)
{
    $email = $data->email;
    $password = $data->password;

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["success" => false, "message" => "Invalid email format"]);
        return;
    }

    // Check if the email ends with @atu.ie
    if (!preg_match('/@atu\.ie$/', $email)) {
        echo json_encode(["success" => false, "message" => "Only @atu.ie email addresses are allowed"]);
        return;
    }

    // Check if password is minimum 8 characters long
    if (strlen($password) < 8) {
        echo json_encode(["success" => false, "message" => "Password must be at least 8 characters long"]);
        return;
    }

    // Hash the password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Prepare and execute a SQL query to insert the new user
    $stmt = $conn->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
    $stmt->bind_param("ss", $email, $hashed_password);

    if ($stmt->execute()) {
        $user_id = $conn->insert_id; // Get the ID of the newly created user
        echo json_encode([
            "success" => true, 
            "message" => "User registered successfully",
            "user" => ["id" => $user_id, "email" => $email]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Error registering user"]);
    }
}

// Function to handle question submission
function submitQuestion($conn, $data)
{
    // Check if user is authenticated
    if (!isset($data->userId) || empty($data->userId)) {
        echo json_encode(["success" => false, "message" => "User authentication required"]);
        return;
    }

    // Validate question data
    if (empty($data->title) || empty($data->body)) {
        echo json_encode(["success" => false, "message" => "Title and body are required"]);
        return;
    }

    try {
        // Prepare and execute SQL query to insert the question
        $stmt = $conn->prepare("INSERT INTO questions (user_id, title, body, tags) VALUES (?, ?, ?, ?)");
        if (!$stmt) {
            echo json_encode(["success" => false, "message" => "Database error"]);
            return;
        }
        
        $stmt->bind_param("isss", $data->userId, $data->title, $data->body, $data->tags);
        
        if ($stmt->execute()) {
            $questionId = $stmt->insert_id;
            echo json_encode([
                "success" => true, 
                "message" => "Question submitted successfully",
                "questionId" => $questionId
            ]);
        } else {
            echo json_encode([
                "success" => false, 
                "message" => "Error submitting question"
            ]);
        }
        
        $stmt->close();
    } catch (Exception $e) {
        echo json_encode([
            "success" => false, 
            "message" => "Error processing question"
        ]);
    }
}
?>