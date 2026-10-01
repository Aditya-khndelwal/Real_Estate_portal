Aditya Anand~
I am building the backend for a Fractional Real Estate Investment Portal using Node.js, Express, and Mongoose. 

Please generate the code for Stage 2 (Authentication & RBAC):

1. server/src/validators/authValidator.js (using Zod):
   - Signup schema: name, email, phone, password (min 8 chars, numbers/symbols), role [INVESTOR | BROKER] (Note: ADMIN cannot be self-registered).
   - Login schema: email, password.

2. server/src/controllers/authController.js:
   - POST /api/v1/auth/signup: Hash password using bcrypt (cost 10-12), save user, and return JWT access token + user object (excluding passwordHash). If role is BROKER, set brokerApproved to false.
   - POST /api/v1/auth/login: Find user by email, verify password with bcrypt, check if user.isActive is true (throw 401 if deactivated), and return JWT access token + user object.
   - GET /api/v1/auth/me: Return current authenticated user profile from req.user.

3. server/src/middlewares/auth.js:
   - authenticate middleware: Extract Bearer token from Authorization header, verify JWT, fetch user from DB (checking if user still exists and isActive: true), and attach user to req.user.
   - authorize(...roles) middleware: Check if req.user.role is included in the allowed roles array. Return 403 Forbidden if unauthorized.

4. server/src/routes/authRoutes.js:
   - Wire up the routes to their respective controllers using the authentication middleware where appropriate.