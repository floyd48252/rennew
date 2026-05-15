# Admin Login Details

## Default Administrator Credentials

**Email:** admin@industrialcommercialanddomesticcleaningsolutions.com  
**Password:** Admin123!

## Access Information

- **Admin Dashboard:** http://localhost:8080/admin-dashboard.html
- **Login Location:** Main website login form
- **Account Type:** Single Administrator Account

## Security Notes

⚠️ **Important Security Information:**
- This is the default admin account for the system
- Only one admin account is permitted for security
- Password can be changed via admin dashboard
- Email address cannot be changed (fixed for security)

## Login Instructions

1. Go to the main website (index.html)
2. Click on login or access admin section
3. Enter the email: `admin@industrialcommercialanddomesticcleaningsolutions.com`
4. Enter the password: `Admin123!`
5. Click login to access admin dashboard

## Features Available

Once logged in, the admin can:
- Manage customers and accounts
- Create and manage invoices
- Handle service requests
- Change password (recommended for production)
- View analytics and reports
- Export customer data

## Production Deployment

For production use:
1. Change the default password immediately
2. Update email configuration in server.js
3. Set up proper email service credentials
4. Configure domain and security settings

## Support

For any issues with admin access:
- Check browser console for error messages
- Verify server is running on port 8080
- Ensure auth.js is properly loaded
- Contact technical support if needed
