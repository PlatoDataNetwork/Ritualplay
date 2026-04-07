const http = require('http')
const config = require('./config')
const socketio = require('socket.io')
const gameSocket = require('./socket/index')
const app = require('./app')

// Connect and get reference to mongodb instance
// let db;

// (async function () {
//   db = await connectDB();
// })();

const server = http.createServer(app)

server.listen(config.PORT, () => {
    // console.log(
    //     `Server is running in ${config.NODE_ENV} mode and is listening on port ${config.PORT}...`
    // );
})

//  Handle real-time poker game logic with socket.io
const io = socketio(server)

io.on('connect', (socket) => gameSocket.init(socket, io))

// Error handling 
process.on('uncaughtException', (err) => {
    // 
})

process.on("unhandledRejection", (err) => {
    // 
})

