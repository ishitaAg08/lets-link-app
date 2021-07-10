//Loading dependencies & initializing express
require("dotenv").config()
const express = require("express")
const cors = require("cors")
const http = require("http")//for creating http server
const app = express()
const server = http.createServer(app) //Initialize http server and associate it with express
//Initialize socket.io
const io = require("socket.io")(server) //For signalling in WebRTC

app.use(cors())

//Define a route
app.get("/", (req, res) => {
	res.send({ response: "Server is up and running." }).status(200);
  });


//Implementing Socket.io
//connection event is fired as soon as a client connects to this socket.
io.on("connection", (socket) => {
	socket.emit("me", socket.id)
	
	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
	})

	socket.on("callUser", (data) => {
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
	})

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	})
})

//Ports on which server should listen - 8000 or the one provided by the environment
const port= process.env.PORT || 5000;
server.listen(port, () => console.log(`server is running on port ${port}`))
