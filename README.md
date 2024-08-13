## **Overview**

The **User Management API** is a comprehensive solution for handling user authentication and profile management in web applications. This API provides endpoints for user registration, activation, login, and secure session handling, along with profile and password updates. Designed with security in mind, it ensures all sensitive operations are protected with authentication and authorization mechanisms.

## **Features**

- **User Registration**: Allows new users to register by providing necessary details.
- **Account Activation**: Supports user account activation via a token-based system.
- **User Login**: Provides secure user authentication using email and password.
- **Social Authentication**: Enables login through social media accounts.
- **Session Management**: Implements secure logout functionality and token refresh mechanisms.
- **Profile Management**: Allows users to update their profile information and avatar.
- **Password Management**: Supports secure password updates.
- **Middleware Protection**: Ensures all sensitive routes are protected with authentication middleware.

## **API Endpoints**

### **User Authentication**

- **POST** `/register`  
  Registers a new user.

- **POST** `/activate`  
  Activates the user account via a token.

- **POST** `/login`  
  Authenticates a user and generates an access token.

- **GET** `/logout`  
  Logs out the authenticated user and invalidates the session.

- **GET** `/updatetoken`  
  Refreshes the access token.

### **Profile Management**

- **GET** `/user`  
  Retrieves authenticated user information.

- **POST** `/socialauth`  
  Handles social media login.

- **PUT** `/updateprofile`  
  Updates user profile details.

- **PUT** `/updatepassword`  
  Updates the user password.

- **PUT** `/updateavatar`  
  Updates the user's avatar.

## **Technologies Used**

- **Node.js**: Server-side JavaScript runtime.
- **Express.js**: Web framework for building the API.
- **JWT**: JSON Web Token for secure authentication.
- **MongoDB/MySQL**: Database for storing user information.

## **Installation**

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/user-management-api.git
   ```
2. Install dependencies:
   ```bash
   cd user-management-api
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file and add your database connection string, JWT secret, and other necessary configuration.
   Here's how you can add the environment variable section to the README without including the actual values:

   - To run this project, you will need to add the following environment variables to your `.env` file:

    ```bash
    # Server Configuration
    PORT = <your_port_number>           # e.g., 4001
    ORIGIN = <your_frontend_origin>     # e.g., {"http://localhost:3000"}
    NODE_ENV = <environment>            # e.g., "development"
    
    # Database Configuration
    DB_URL = <your_database_url>        # e.g., mongodb://localhost:27017/LMS
    
    # Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME = <your_cloudinary_cloud_name>
    CLOUDINARY_API_KEY = <your_cloudinary_api_key>
    CLOUDINARY_API_SECRET = <your_cloudinary_api_secret>
    
    # Redis Configuration
    REDIS_URL = <your_redis_url>
    
    # JWT Configuration
    JWT_SECRET = <your_jwt_secret>
    
    # SMTP Configuration
    SMTP_HOST = <your_smtp_host>
    SMTP_PORT = <your_smtp_port>
    SMTP_SERVICE = <your_smtp_service>
    SMTP_MAIL = <your_smtp_email>
    SMTP_PASSWORD = <your_smtp_password>
    
    # Token Expiration
    ACCESS_TOKEN = <your_access_token_secret>
    REFRESH_TOKEN = <your_refresh_token_secret>
    ACCESS_TOKEN_EXPIRE = <access_token_expiry_time_in_minutes>
    REFRESH_TOKEN_EXPIRE = <refresh_token_expiry_time_in_days>
    ```
    ### Note:
    - Replace `<your_value>` with the actual values for your environment.
    - Keep these values secure and do not share them publicly.
    
4. Run the server:
   ```bash
   npm start
   ```

## **Usage**

- Use a tool like Postman to test the API endpoints.
- Ensure the server is running and use the provided routes to interact with the API.
