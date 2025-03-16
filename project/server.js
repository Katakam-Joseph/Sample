const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose
   .connect('mongodb+srv://rajudavid81:bNnRqbxVpytdrWoz@cluster0.v1ex4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
   .then(() => console.log("Connected to MongoDB"))
   .catch(err => console.error("Failed to connect to MongoDB", err));

// Define the Mongoose schema and model
const Client = mongoose.model('Client', {
    cliName: String,
    cliPhone: String,
    eventDate: String,
    eventLoc: String
});

const Review = mongoose.model('Review', {
    cliName: String,
    message: String
});

const Reservation = mongoose.model('Reservation', {
    name: String,
    email: String,
    phone: String,
    city: String,
    event: String,
    date: String,
    location: String,
    venue: String,
});

// Middleware to parse form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // To handle JSON-encoded bodies
app.use(express.static(path.join(__dirname, 'public')));

// Mock user data (replace with a database)
const adminUser = {
    username: 'pradeep',
    password: 'pradeep25' // Always hash passwords in production
};

// Session middleware
app.use(
    session({
        secret: 'your-secret-key', // Replace with a strong secret key
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // Use secure: true in production
    })
);

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/gal', (req, res) => {
    res.sendFile(path.join(__dirname, 'gallery.html'));
});

app.get('/abt', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});


// Handle form submissions
app.post('/cli-reg', (req, res) => {
    const { name: cliName, phone: cliPhone, eventdate: eventDate, eventlocation: eventLoc } = req.body;

    const cli = new Client({ cliName, cliPhone, eventDate, eventLoc });
    cli.save()
        .then(() => {
            res.send(`
                <script>
                    alert("Client data added successfully!");
                    window.location.href = "/";
                </script>
            `);
        })
        .catch(err => {
            console.error(err);
            res.send(`
                <script>
                    alert("Error saving client data.");
                    window.location.href = "/";
                </script>
            `);
        });
});

app.post('/rev-info', async (req, res) => {
    const { Name: cliName, Message: message } = req.body;

    try {
        const review = new Review({ cliName, message });
        await review.save();

        // Respond with success status
        res.status(200).json({ success: true, message: "Review submitted successfully!" });
    } catch (err) {
        console.error('Error saving review:', err);

        // Respond with error status
        res.status(500).json({ success: false, message: "Error saving review. Please try again." });
    }
});


app.get('/rev-info', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ _id: -1 }).limit(10); // Fetch 10 most recent reviews
        res.json(reviews); // Send reviews data in JSON format
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).send('Error fetching reviews');
    }
});


// Handle reservation form submissions
app.post('/reserve', (req, res) => {
    const {name,email,phone,city,event,date,location,venue,} = req.body;

    const reservation = new Reservation({
        name,
        email,
        phone,
        city,
        event,
        date,
        location,
        venue,
    });

    reservation
        .save()
        .then(() => {
            res.send(`
                <script>
                    alert("Reservation submitted successfully!");
                    window.location.href = "/";
                </script>
            `);
        })
        .catch((err) => {
            console.error('Error saving reservation:', err);
            res.send(`
                <script>
                    alert("Error submitting reservation. Please try again.");
                    window.location.href = "/";
                </script>
            `);
        });
});


// Admin routes to fetch data
app.get('/admin/clients', async (req, res) => {
    try {
        const clients = await Client.find();
        res.json(clients); // Send clients data in JSON format
    } catch (err) {
        console.error('Error fetching clients:', err);
        res.status(500).send('Error fetching clients');
    }
});

app.get('/admin/review', async (req, res) => {
    try {
        const reviews = await Review.find();
        res.json(reviews); // Send reviews data in JSON format
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).send('Error fetching reviews');
    }
});

// Admin routes to delete data
app.delete('/admin/clients/:id', async (req, res) => {
    try {
        await Client.findByIdAndDelete(req.params.id);
        res.status(200).send('Client deleted successfully');
    } catch (err) {
        console.error('Error deleting client:', err);
        res.status(500).send('Error deleting client');
    }
});

app.delete('/admin/review/:id', async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.status(200).send('Review deleted successfully');
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).send('Error deleting review');
    }
});

// Fetch all reservations (Admin Dashboard)
app.get('/admin/reservations', async (req, res) => {
    try {
        const reservations = await Reservation.find();
        res.json(reservations); // Send reservation data in JSON format
    } catch (err) {
        console.error('Error fetching reservations:', err);
        res.status(500).send('Error fetching reservations');
    }
});

// Delete a reservation (Admin Dashboard)
app.delete('/admin/reservations/:id', async (req, res) => {
    try {
        await Reservation.findByIdAndDelete(req.params.id);
        res.status(200).send('Reservation deleted successfully');
    } catch (err) {
        console.error('Error deleting reservation:', err);
        res.status(500).send('Error deleting reservation');
    }
});

// Login endpoint
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (username === adminUser.username && password === adminUser.password) {
        // Set session
        req.session.isAuthenticated = true;
        return res.status(200).json({ message: 'Login successful' });
    } else {
        return res.status(401).json({ message: 'Invalid username or password' });
    }
});

// Middleware to protect routes
function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
        return next();
    }
    res.status(401).send('Unauthorized access. Please log in.');
}

// Dashboard route (protected)
app.get('/admin/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'protected', 'admindashboard.html'));
});

// Logout endpoint
app.post('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.status(200).json({ message: 'Logged out successfully' });
    });
});

// Fallback for undefined routes
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// Rewrite URLs to serve files without the .html extension
app.get('/:file', (req, res, next) => {
    const filePath = path.join(__dirname, 'public', `${req.params.file}.html`);
    res.sendFile(filePath, (err) => {
      if (err) {
        next(); // Proceed to the next middleware if file not found
      }
    });
  });
  
  // Default route for the homepage (if needed)
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  
  // Handle 404 for unmatched routes
  app.use((req, res) => {
    res.status(404).send('Page not found');
  });

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
