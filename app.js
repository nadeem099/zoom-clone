const express = require('express');
const app = express();
const server = require('http').Server(app);
const {v4: uuidv4} = require('uuid');
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {debug: true})

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/peerjs', peerServer);

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/:room', (req, res) => {
    res.render('classroom', {roomId: req.params.room})
})


// socket connections
io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId);
        socket.on('message', (message) => {
            io.sockets.in(roomId).emit('message-to-all', message, userId)
        });
        socket.on('disconnect-user', () => {
            console.log('user disconnected on closing the browser tab')
            socket.broadcast.to(roomId).emit('user-disconnected', userId);
        });
    });
})




//starting the server
server.listen(process.env.PORT||3030);
console.log('Server started')