const moment = require("moment-timezone");
const { Server } = require("socket.io");
const userModel = require("./models/user.model");
const rideModel = require("./models/ride.model");
const captainModel = require("./models/captain.model");
const frontendLogModel = require("./models/frontend-log.model");
const mapService = require("./services/map.service");

let io;

// In-memory store for active connections (for fast lookups)
const activeConnections = new Map();

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    // Connection settings for reliability
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Production logging
    if (process.env.ENVIRONMENT === "production") {
      socket.on("log", async (log) => {
        log.formattedTimestamp = moment().tz("Asia/Kolkata").format("MMM DD hh:mm:ss A");
        try {
          await frontendLogModel.create(log);
        } catch (error) {
          console.error("[Socket] Error saving log:", error.message);
        }
      });
    }

    /**
     * JOIN EVENT - Called when user/captain connects
     * Updates database with socketId and sets online status
     */
    socket.on("join", async (data) => {
      const { userId, userType } = data;
      
      if (!userId || !userType) {
        console.error("[Socket] Join failed: Missing userId or userType");
        return socket.emit("error", { message: "Missing userId or userType" });
      }

      console.log(`[Socket] ${userType} joining: ${userId}`);

      try {
        if (userType === "user") {
          await userModel.findByIdAndUpdate(userId, { 
            socketId: socket.id 
          });
          
          // Track connection
          activeConnections.set(socket.id, { 
            type: "user", 
            id: userId,
            connectedAt: new Date()
          });
          
          console.log(`[Socket] ✓ User ${userId} connected with socket ${socket.id}`);
          
        } else if (userType === "captain") {
          // Use the new setOnline static method
          const captain = await captainModel.setOnline(userId, socket.id);
          
          if (captain) {
            // Track connection
            activeConnections.set(socket.id, { 
              type: "captain", 
              id: userId,
              vehicleType: captain.vehicle?.type,
              connectedAt: new Date()
            });
            
            console.log(`[Socket] ✓ Captain ${userId} is now ONLINE with socket ${socket.id}`);
            console.log(`[Socket]   Vehicle: ${captain.vehicle?.type}, Location: [${captain.location?.coordinates}]`);
            
            // Notify captain they're online
            socket.emit("status-update", { 
              status: "online",
              message: "You are now online and can receive ride requests"
            });
          } else {
            console.error(`[Socket] ✗ Captain ${userId} not found in database`);
            socket.emit("error", { message: "Captain not found" });
          }
        }
      } catch (error) {
        console.error(`[Socket] ✗ Join error for ${userType} ${userId}:`, error.message);
        socket.emit("error", { message: "Failed to join" });
      }
    });

    /**
     * UPDATE LOCATION - Captain updates their GPS location
     * This is CRITICAL for ride matching to work
     */
    socket.on("update-location-captain", async (data) => {
      const { userId, location } = data;

      if (!location || typeof location.ltd !== "number" || typeof location.lng !== "number") {
        console.error("[Socket] Invalid location data:", location);
        return socket.emit("error", { message: "Invalid location data" });
      }

      try {
        // Use the new updateLocation static method
        const captain = await captainModel.updateLocation(userId, location.lng, location.ltd);
        
        if (captain) {
          console.log(`[Socket] ✓ Captain ${userId} location updated: [${location.lng}, ${location.ltd}]`);
          
          // Confirm location update to captain
          socket.emit("location-updated", {
            coordinates: [location.lng, location.ltd],
            timestamp: new Date()
          });

          // Broadcast live location to the user for the active ride (accepted or ongoing)
          try {
            const activeRide = await rideModel
              .findOne({
                captain: userId,
                status: { $in: ["accepted", "ongoing"] },
              })
              .populate("user", "socketId");

            if (activeRide?.user?.socketId) {
              const payload = {
                rideId: activeRide._id,
                location: {
                  ltd: location.ltd,
                  lng: location.lng,
                },
                updatedAt: new Date(),
              };

              console.log(
                `[Socket] Broadcasting captain live location to user socket ${activeRide.user.socketId} for ride ${activeRide._id}`
              );

              sendMessageToSocketId(activeRide.user.socketId, {
                event: "captain-location",
                data: payload,
              });
            }
          } catch (err) {
            console.error("[Socket] ✗ Error broadcasting captain location:", err.message);
          }
        } else {
          console.error(`[Socket] ✗ Captain ${userId} not found for location update`);
        }
      } catch (error) {
        console.error(`[Socket] ✗ Location update error:`, error.message);
        socket.emit("error", { message: "Failed to update location" });
      }
    });

    /**
     * UPDATE LOCATION - User shares live location to get nearby captains
     * Client should emit: { userId, location: { ltd, lng }, radius (km), vehicleType }
     * Server responds on the same socket with event 'nearby-captains'
     */
    socket.on("update-location-user", async (data) => {
      const { userId, location, radius = 4, vehicleType } = data || {};

      if (!location || typeof location.ltd !== "number" || typeof location.lng !== "number") {
        console.error("[Socket] Invalid user location data:", location);
        return socket.emit("error", { message: "Invalid location data" });
      }

      try {
        // Query for captains in radius
        const captains = await mapService.getCaptainsInTheRadius(
          location.ltd,
          location.lng,
          radius,
          vehicleType || "car"
        );

        // Send simplified captain info back to the requesting user
        const payload = captains.map((c) => ({
          _id: c._id,
          fullname: c.fullname,
          socketId: c.socketId,
          vehicle: c.vehicle,
          location: c.location,
        }));

        socket.emit("nearby-captains", { captains: payload });
        console.log(`[Socket] Sent ${payload.length} nearby captains to user ${userId || socket.id}`);
      } catch (error) {
        console.error("[Socket] ✗ Error finding nearby captains:", error.message);
        socket.emit("nearby-captains", { captains: [] });
      }
    });

    /**
     * JOIN ROOM - For chat functionality
     */
    socket.on("join-room", (roomId) => {
      if (roomId && roomId !== "123456789012345678901234") { // Ignore default ride ID
        socket.join(roomId);
        console.log(`[Socket] ${socket.id} joined room: ${roomId}`);
      }
    });

    /**
     * MESSAGE - Chat messages between user and captain
     */
    socket.on("message", async ({ rideId, msg, userType, time }) => {
      const date = moment().tz("Asia/Kolkata").format("MMM DD");
      
      // Broadcast to room (excluding sender)
      socket.to(rideId).emit("receiveMessage", { msg, by: userType, time });
      
      // Save to database
      try {
        const ride = await rideModel.findOne({ _id: rideId });
        if (ride) {
          ride.messages.push({
            msg: msg,
            by: userType,
            time: time,
            date: date,
            timestamp: new Date(),
          });
          await ride.save();
          console.log(`[Socket] ✓ Message saved to ride ${rideId}`);
        }
      } catch (error) {
        console.error("[Socket] ✗ Error saving message:", error.message);
      }
    });

    /**
     * DISCONNECT - Handle client disconnection
     * CRITICAL: Mark captain as offline so they don't receive rides
     */
    socket.on("disconnect", async (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id}, reason: ${reason}`);

      const connection = activeConnections.get(socket.id);
      
      if (connection) {
        try {
          if (connection.type === "captain") {
            // Set captain offline using static method
            const captain = await captainModel.setOffline(socket.id);
            
            if (captain) {
              console.log(`[Socket] ✓ Captain ${connection.id} is now OFFLINE`);
            }
          } else if (connection.type === "user") {
            // Clear user's socketId
            await userModel.findByIdAndUpdate(connection.id, { socketId: null });
            console.log(`[Socket] ✓ User ${connection.id} disconnected`);
          }
          
          // Remove from active connections
          activeConnections.delete(socket.id);
          
        } catch (error) {
          console.error(`[Socket] ✗ Disconnect cleanup error:`, error.message);
        }
      }
    });

    /**
     * ERROR - Handle socket errors
     */
    socket.on("error", (error) => {
      console.error(`[Socket] Socket error for ${socket.id}:`, error.message);
    });
  });

  // Log active connections periodically (debug)
  if (process.env.ENVIRONMENT !== "production") {
    setInterval(() => {
      const captains = Array.from(activeConnections.values()).filter(c => c.type === "captain");
      const users = Array.from(activeConnections.values()).filter(c => c.type === "user");
      console.log(`[Socket] Active connections - Captains: ${captains.length}, Users: ${users.length}`);
    }, 60000); // Every minute
  }
}

/**
 * Send message to a specific socket
 * @param {string} socketId - Target socket ID
 * @param {object} messageObject - { event: string, data: any }
 */
const sendMessageToSocketId = (socketId, messageObject) => {
  if (!io) {
    console.error("[Socket] ✗ Socket.io not initialized");
    return false;
  }

  if (!socketId) {
    console.error("[Socket] ✗ Cannot send message: socketId is null/undefined");
    return false;
  }

  console.log(`[Socket] Sending '${messageObject.event}' to socket: ${socketId}`);
  io.to(socketId).emit(messageObject.event, messageObject.data);
  return true;
};

/**
 * Broadcast to all sockets in a room
 * @param {string} roomId - Room ID
 * @param {object} messageObject - { event: string, data: any }
 */
const broadcastToRoom = (roomId, messageObject) => {
  if (!io) {
    console.error("[Socket] ✗ Socket.io not initialized");
    return false;
  }

  console.log(`[Socket] Broadcasting '${messageObject.event}' to room: ${roomId}`);
  io.to(roomId).emit(messageObject.event, messageObject.data);
  return true;
};

/**
 * Get count of active connections by type
 */
const getActiveConnectionsCount = () => {
  const captains = Array.from(activeConnections.values()).filter(c => c.type === "captain").length;
  const users = Array.from(activeConnections.values()).filter(c => c.type === "user").length;
  return { captains, users, total: activeConnections.size };
};

/**
 * Check if a socket is connected
 * @param {string} socketId 
 */
const isSocketConnected = (socketId) => {
  return activeConnections.has(socketId);
};

module.exports = { 
  initializeSocket, 
  sendMessageToSocketId,
  broadcastToRoom,
  getActiveConnectionsCount,
  isSocketConnected
};
