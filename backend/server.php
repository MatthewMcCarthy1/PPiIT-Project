<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Connect to the MySQL database
$conn = new mysqli("localhost", "root", "", "ppiitprojectdb");

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Decode the JSON data sent from the client
$data = json_decode(file_get_contents("php://input"));

// Check if an action is specified in the request
if (isset($data->action)) {
    switch($data->action) {
        case 'login':
            login($conn, $data);
            break;
        case 'register':
            register($conn, $data);
            break;
        default:
            echo json_encode(["success" => false, "message" => "Invalid action"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "No action specified"]);
}

// Function to handle user login
function login($conn, $data) {
    $email = $data->email;
    $password = $data->password;

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
function register($conn, $data) {
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

    // Hash the password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Prepare and execute a SQL query to insert the new user
    $stmt = $conn->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
    $stmt->bind_param("ss", $email, $hashed_password);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "User registered successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Error registering user"]);
    }
}

// Close the database connection
$conn->close();

?>
