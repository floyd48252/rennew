const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');

const app = express();
const PORT = 8080;

// Company Email Configuration
const COMPANY_EMAILS = {
    admin: 'admin@industrialcommercialanddomesticcleaningsolutions.com',
    support: 'support@industrialcommercialanddomesticcleaningsolutions.com',
    customerService: 'customerservice@industrialcommercialanddomesticcleaningsolutions.com',
    info: 'info@industrialcommercialanddomesticcleaningsolutions.com',
    sales: 'sales@industrialcommercialanddomesticcleaningsolutions.com',
    accounting: 'accounting@industrialcommercialanddomesticcleaningsolutions.com'
};

// Email Transporter Configuration
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // Replace with actual email
        pass: 'your-app-password' // Replace with actual password
    }
});

// Simple in-memory user storage for demo
const users = [];
const adminCredentials = { email: 'admin@industrialcommercialanddomesticcleaningsolutions.com', password: 'Admin123!' };

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Authentication middleware
const checkAuth = (req, res, next) => {
    // Allow access to login/register pages and static assets
    if (req.path === '/index.html' || req.path === '/login.html' || req.path === '/register.html' || req.path === '/admin-login.html' || 
        req.path === '/styles.css' || req.path === '/auth.js' || req.path === '/logo.jpeg' || 
        req.path === '/manifest.json' || req.path.startsWith('/images/') || req.path.startsWith('/icons/')) {
        return next();
    }
    
    // Check for authentication token in localStorage (simulated via headers)
    const token = req.headers['x-auth-token'];
    if (!token) {
        return res.status(401).json({ error: 'No authentication token' });
    }
    
    // Simple token validation (in real app, this would be JWT verification)
    const user = users.find(u => u.token === token);
    if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
};

// Protected routes middleware
const requireAuth = (req, res, next) => {
    checkAuth(req, res, () => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        next();
    });
};

// API endpoint for user authentication
app.post('/api/auth', (req, res) => {
    const { email, password, action } = req.body;
    
    if (action === 'login') {
        // Check admin credentials
        if (email === 'admin@cleaning.com' && password === 'Admin123!') {
            const token = 'admin-token-' + Date.now();
            const adminUser = { email, type: 'admin', name: 'Administrator' };
            users.push(adminUser);
            return res.json({
                success: true,
                user: adminUser,
                token
            });
        }
        
        // Check customer credentials (simplified for demo)
        const demoCustomers = [
            { email: 'john.doe@email.com', password: 'customer123', name: 'John Doe', company: 'Doe Enterprises' },
            { email: 'jane.smith@email.com', password: 'customer123', name: 'Jane Smith', company: 'Smith Consulting' },
            { email: 'mike.wilson@email.com', password: 'customer123', name: 'Mike Wilson', company: 'Wilson Services' }
        ];
        
        const customer = demoCustomers.find(c => c.email === email && c.password === password);
        if (customer) {
            const token = 'customer-token-' + Date.now();
            const customerUser = { 
                ...customer, 
                type: 'customer',
                invoices: [],
                service_requests: []
            };
            users.push(customerUser);
            return res.json({
                success: true,
                user: customerUser,
                token
            });
        }
        
        return res.json({ success: false, error: 'Invalid credentials' });
    }
    
    if (action === 'register') {
        const { first_name, last_name, phone, company_name } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password required' });
        }
        
        // For demo, just return success (no actual storage)
        return res.json({
            success: true,
            user: {
                email,
                first_name: first_name || 'Customer',
                last_name: last_name || '',
                phone: phone || 'N/A',
                company_name: company_name || 'N/A',
                type: 'customer',
                invoices: [],
                service_requests: []
            },
            token: 'customer-token-' + Date.now()
        });
    }
    
    return res.status(400).json({ success: false, error: 'Invalid action' });
});

// API endpoint for service requests
app.post('/api/service-requests', requireAuth, (req, res) => {
    const { service_type, description, requested_date } = req.body;
    
    if (!service_type || !description) {
        return res.status(400).json({ success: false, error: 'Service type and description required' });
    }
    
    const request = {
        id: Date.now(),
        customer_email: req.user.email,
        service_type,
        description,
        requested_date: requested_date || 'Flexible',
        status: 'Pending',
        created_at: new Date().toISOString()
    };
    
    // Store in user's service requests (in real app, this would be database)
    if (!req.user.service_requests) {
        req.user.service_requests = [];
    }
    req.user.service_requests.push(request);
    
    res.json({ success: true, request });
});

// API endpoint for invoices
app.post('/api/invoices', requireAuth, (req, res) => {
    const { customer_email, invoice_number, description, amount, due_date } = req.body;
    
    if (!customer_email || !invoice_number || !description || !amount || !due_date) {
        return res.status(400).json({ success: false, error: 'All invoice fields required' });
    }
    
    const invoice = {
        id: Date.now(),
        customer_email,
        invoice_number,
        description,
        amount: parseFloat(amount).toFixed(2),
        due_date,
        status: 'Pending',
        created_at: new Date().toISOString()
    };
    
    // Store in user's invoices (in real app, this would be database)
    if (!req.user.invoices) {
        req.user.invoices = [];
    }
    req.user.invoices.push(invoice);
    
    res.json({ success: true, invoice });
});

// API endpoint to get user data
app.get('/api/user', requireAuth, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// API endpoint to get all users (admin only)
app.get('/api/users', requireAuth, (req, res) => {
    if (req.user.type !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json({
        success: true,
        users: users.filter(u => u.type === 'customer')
    });
});

// Serve main page with auth check
app.get('/index.html', checkAuth, (req, res) => {
    if (!req.user) {
        // Redirect to login page if not authenticated
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve login pages
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/admin-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

// Logout endpoint
app.post('/api/logout', requireAuth, (req, res) => {
    // Remove user from users array
    const index = users.findIndex(u => u.email === req.user.email);
    if (index !== -1) {
        users.splice(index, 1);
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
});

// Contact Form Submission
app.post('/api/contact', async (req, res) => {
    try {
        const { name, phone, service, location, message, emailPreference } = req.body;
        
        // Get selected email
        const selectedEmail = COMPANY_EMAILS[emailPreference] || COMPANY_EMAILS.info;
        
        // Create email content
        const emailContent = `
            New Contact Form Submission
            
            Contact Information:
            Name: ${name}
            Phone: ${phone}
            Email: ${selectedEmail}
            
            Service Request:
            Service Type: ${service}
            Location: ${location}
            Message: ${message}
            
            Email Preference: ${emailPreference}
            Requested Response Email: ${selectedEmail}
            
            All Available Contacts:
            Customer Service: ${COMPANY_EMAILS.customerService}
            Technical Support: ${COMPANY_EMAILS.support}
            Sales & Quotes: ${COMPANY_EMAILS.sales}
            Accounting & Billing: ${COMPANY_EMAILS.accounting}
            Administrator: ${COMPANY_EMAILS.admin}
        `;
        
        // Send email
        await transporter.sendMail({
            from: 'your-email@gmail.com',
            to: selectedEmail,
            cc: COMPANY_EMAILS.info, // Send copy to general info
            subject: `New Contact Form Submission - ${service}`,
            text: emailContent,
            html: `<pre>${emailContent}</pre>`
        });
        
        // Save submission data
        const submission = {
            timestamp: new Date().toISOString(),
            name,
            phone,
            service,
            location,
            message,
            emailPreference,
            selectedEmail,
            ip: req.ip
        };
        
        fs.writeFileSync(
            `data/contact_${Date.now()}.json`,
            JSON.stringify(submission, null, 2)
        );
        
        res.json({ 
            success: true, 
            message: 'Contact form submitted successfully',
            email: selectedEmail 
        });
        
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting contact form' 
        });
    }
});

// Service Request Form Submission
app.post('/api/service-request', async (req, res) => {
    try {
        const { 
            service_type, description, requested_date, property_type, 
            square_footage, number_of_rooms, number_of_bathrooms, 
            frequency, additional_services, contact_phone, 
            best_contact_time, special_instructions 
        } = req.body;
        
        // Create email content with routing
        const emailContent = `
            New Service Request Submission
            
            Service Details:
            Service Type: ${service_type}
            Description: ${description}
            Requested Date: ${requested_date}
            
            Property Information:
            Property Type: ${property_type}
            Square Footage: ${square_footage}
            Number of Rooms: ${number_of_rooms}
            Number of Bathrooms: ${number_of_bathrooms}
            Frequency: ${frequency}
            
            Additional Services: ${JSON.stringify(additional_services, null, 2)}
            
            Contact Information:
            Phone: ${contact_phone}
            Best Contact Time: ${best_contact_time}
            Special Instructions: ${special_instructions}
            
            Email Routing: ${COMPANY_EMAILS.info}
            Customer Service: ${COMPANY_EMAILS.customerService}
            Technical Support: ${COMPANY_EMAILS.support}
            Sales & Quotes: ${COMPANY_EMAILS.sales}
            Accounting & Billing: ${COMPANY_EMAILS.accounting}
        `;
        
        // Send email to appropriate department
        let targetEmail = COMPANY_EMAILS.info;
        if (service_type.toLowerCase().includes('cleaning')) {
            targetEmail = COMPANY_EMAILS.sales;
        } else if (service_type.toLowerCase().includes('emergency')) {
            targetEmail = COMPANY_EMAILS.support;
        }
        
        await transporter.sendMail({
            from: 'your-email@gmail.com',
            to: targetEmail,
            cc: COMPANY_EMAILS.info,
            subject: `New Service Request - ${service_type}`,
            text: emailContent,
            html: `<pre>${emailContent}</pre>`
        });
        
        // Save submission data
        const submission = {
            timestamp: new Date().toISOString(),
            service_type,
            description,
            requested_date,
            property_type,
            square_footage,
            number_of_rooms,
            number_of_bathrooms,
            frequency,
            additional_services,
            contact_phone,
            best_contact_time,
            special_instructions,
            targetEmail,
            ip: req.ip
        };
        
        fs.writeFileSync(
            `data/service_${Date.now()}.json`,
            JSON.stringify(submission, null, 2)
        );
        
        res.json({ 
            success: true, 
            message: 'Service request submitted successfully',
            email: targetEmail 
        });
        
    } catch (error) {
        console.error('Service request error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting service request' 
        });
    }
});

// Password Change API
app.post('/api/admin/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'All password fields are required' 
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'New passwords do not match' 
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters long' 
            });
        }
        
        // Verify current admin credentials (in production, this would verify against database)
        const currentAdmin = adminCredentials;
        
        // For demo, check if current password matches
        if (currentPassword === currentAdmin.password) {
            // Update admin credentials
            adminCredentials.password = newPassword;
            
            res.json({ 
                success: true, 
                message: 'Admin password changed successfully' 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }
        
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error changing password' 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        emails: COMPANY_EMAILS 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`New system server running on http://localhost:${PORT}`);
    console.log('Access the system at: http://localhost:8080');
    console.log('Demo admin credentials: admin@cleaning.com / Admin123!');
    console.log('Demo customer credentials: john.doe@email.com / customer123');
    console.log('Authentication required for protected pages');
});
