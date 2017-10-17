const Koa = require('koa')
const staticServer = require('koa-static')
const app = new Koa()
const path = require('path')

const users = {
  Jim: {
    username: 'Jim',
    pwd: 'kkk'
  },
  Nick: {
    username: 'Nick',
    pwd: 'mmm'
  }
}

const onlineUsers = []

// Routing
const port = process.env.PORT || 3001
app.use(staticServer(path.join(__dirname, 'public')))
const server = require('http').createServer(app.callback()).listen(port)
const io = require('socket.io')(server)
// Chatroom

var numUsers = 0

io.on('connection', function (socket) {
  let login = false

  socket.on('login', function (data) {

    login = users[data.username] && users[data.username].pwd === data.pwd

    if (login) {
      onlineUsers.push(data.username)
      socket.emit('login succeed', data)
      socket.broadcast.emit('user joined', {
        onlineUsers
      })
    } else {
      socket.emit('login failed', 'bad username or password')
    }
    console.log(data)
  })

  socket.on('logout', function (user) {
      if (users[user.username]) {
        socket.emit('logout succeed')
        onlineUsers.splice(onlineUsers.indexOf(user.username), 1)
        socket.broadcast.emit('user left', user.username)
      } else {
        socket.emit('logout failed', 'user not exist')
      }
  })

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    })
  })

  // when the client emits 'add user', this listens and executes
  // socket.on('add user', function (username) {
  //   if (addedUser) return;
  //
  //   // we store the username in the socket session for this client
  //   socket.username = username;
  //   ++numUsers;
  //   addedUser = true;
  //   // socket.emit('login', {
  //   //   numUsers: numUsers
  //   // });
  //   // echo globally (all clients) that a person has connected
  //   socket.broadcast.emit('user joined', {
  //     username: socket.username,
  //     numUsers: numUsers
  //   });
  // });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    })
  })

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    })
  })

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // if (addedUser) {
    //   --numUsers;
    //
    //   // echo globally that this client has left
    //   socket.broadcast.emit('user left', {
    //     username: socket.username,
    //     numUsers: numUsers
    //   });
    // }
  })
})
