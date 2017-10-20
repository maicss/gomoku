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

const onlineUsers = {}

// Routing
const port = process.env.PORT || 3001
app.use(staticServer(path.join(__dirname, 'public')))
const server = require('http').createServer(app.callback()).listen(port)
const io = require('socket.io')(server)

io.on('connection', function (socket) {

  // TIPS：两个人对战的时候，创建一个房间进行游戏比较好，这样就不用一直判断了。

  socket.on('client info', (data, fn) => {
    if (data.username) {
      onlineUsers[data.username] = {
        username: data.username,
        socketId: socket.id
      }
      fn && fn(onlineUsers)
      socket.broadcast.emit('user joined', onlineUsers)
    }
  })
  let login = false

  socket.on('login', function (data) {

    login = users[data.username] && users[data.username].pwd === data.pwd

    if (login) {
      onlineUsers[data.username] = {
        username: data.username,
        socketId: socket.id
      }
      socket.emit('login succeed', data)
      socket.broadcast.emit('user joined', onlineUsers)
    } else {
      socket.emit('login failed', 'bad username or password')
    }
  })

  socket.on('logout', function (user) {
      if (users[user.username]) {
        socket.emit('logout succeed')
        delete onlineUsers[user.username]
        socket.broadcast.emit('user left', user.username)
      } else {
        socket.emit('logout failed', 'user not exist')
      }
  })

  // 对战请求
  socket.on('require match', function (config) {
    if (io.sockets.connected[onlineUsers[config.to].socketId]) {
      io.sockets.connected[onlineUsers[config.to].socketId].emit('require match', config)
    }
    // console.log(username, config, fn)
  })

  socket.on('require match res', function (config, res) {
    console.log(res)
    if (res) socket.join('matchRoom')
    if (io.sockets.connected[onlineUsers[config.from].socketId]) {
      io.sockets.connected[onlineUsers[config.from].socketId].emit('require match res', config, res)
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

  })

  socket.on('drop node', (data) => {
    // todo 这里通讯断开断时候断错误处理
    if (io.sockets.connected[onlineUsers[data.to].socketId]) {
      io.sockets.connected[onlineUsers[data.to].socketId].emit('drop node', data)
    }
  })

})
