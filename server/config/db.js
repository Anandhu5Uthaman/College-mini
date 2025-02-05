import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
    try {
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            family: 4,  // Force IPv4
            maxPoolSize: 10,
            keepAlive: true,
            keepAliveInitialDelay: 300000 // 5 minutes
        };

        await mongoose.connect(process.env.MONGODB_URI, options);
        
        console.log('MongoDB Connected Successfully!');
        
        // Test the connection
        await mongoose.connection.db.admin().ping();
        console.log("MongoDB connection is responsive");
        
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        throw error; // Throw error for retry mechanism
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected - retrying connection');
    setTimeout(async () => {
        try {
            await connectDB();
        } catch (error) {
            console.error('Reconnection failed:', error);
        }
    }, 5000);
});

// Handle process termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('Mongoose connection closed through app termination');
        process.exit(0);
    } catch (error) {
        console.error('Error closing Mongoose connection:', error);
        process.exit(1);
    }
});

export default connectDB;