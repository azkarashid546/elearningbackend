const { Server } = require("socket.io");

const initSocketServer = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*', // or your front-end URL
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("A user connected");

        // Listen for `notification` event from the client
        socket.on("notification", (data) => {
            // Broadcast the notification data to all connected clients (admin dashboard)
            io.emit("newNotification", data);
        });

        // Handle user disconnect event
        socket.on("disconnect", () => {
            console.log("A user disconnected");
        });
    });
};

module.exports = initSocketServer;