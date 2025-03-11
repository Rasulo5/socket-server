const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { query } =require('./db');

const app = express();
const route = require("./route");
const { addUser, findUser, getRoomUsers, removeUser } = require('./users');

app.use(cors({
  origin: '*', // Разрешить запросы только с этого домена
  methods: ['GET', 'POST'], // Разрешить только определённые методы
  credentials: true, // Разрешить передачу кук и заголовков авторизации
}));
app.use(route);
const server = http.createServer(app);

// Настройка CORS для Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Разрешить запросы только с этого домена
    methods: ['GET', 'POST'], // Разрешить только определённые методы
    credentials: true, // Разрешить передачу кук и заголовков авторизации
  },
});
 
io.on('connection', (socket) => {

   socket.on('join', async ({ name, room }) => {
    socket.join(room);
    const { user, isExist } = addUser({ name, room });
  
    // Получаем историю сообщений из базы данных
    const { rows } = await query('SELECT * FROM messages WHERE room = $1 ORDER BY created_at ASC', [room]);
  
    // Отправляем историю сообщений пользователю
    rows.forEach((msg) => {
      socket.emit('message', {
        data: { user: { name: msg.user_name }, message: msg.message },
      });
    });
  
    const userMessage = isExist ? `${user.name}, here you go again` : `Hey my love ${user.name}`;
    socket.emit('message', {
      data: { user: { name: 'Admin' }, message: userMessage },
    });
  
    socket.broadcast.to(user.room).emit('message', {
      data: { user: { name: 'Admin' }, message: `${user.name} has joined` },
    });
  
    io.to(user.room).emit('room', {
      data: { users: getRoomUsers(user.room) },
    });
  });
    
    socket.on('sendMessage', async ({ message, params }) => {
        const user = findUser(params);
        if (user) {
            await query(
                'INSERT INTO messages (room, user_name, message) VALUES ($1, $2, $3)', [user.room,user.name, message]
            );
            io.to(user.room).emit('message', { data: { user, message } });
        }
    });

    socket.on('leftRoom', ({ params }) => {
        const user = removeUser(params);
        if(user) {
            const { room, name } = user;
            io.to(room).emit('message', { data: { user : { name: "Admin" }, message: `${name} has left` }, 
            });
            io.to(room).emit('room', { 
                data: {  users: getRoomUsers(room) } });
        }
    });

    socket.on('disconnect', () => {
        console.log("Disconnect");
    });

});

server.listen(5000, () => {
    console.log('Server is running');
});

