/**
 * stage: [[0, 0, 0], [0,1,1], [0, 2, 2]]
 * 第三位为棋子颜色，0表示空位，1表示white，2表示black
 * */
Object.defineProperty(Array.prototype, 'put', {
  value: function (child) {
    if (this.length === 10) {
      this.shift()
      this.push(child)
    }
    this.push(child)
  },
  enumerable: false,
  configurable: false,
  writable: false
})

/**
 * 撤销：
 *    一个定长为10的数组
 *    当一个角色点击撤销的时候，不管当前该谁下，都需要把当前棋盘撤销到自己该下子的角色，可能是从数组里删除一个子，也可能是3个
 *
 * */

class Gomoku {
  /**
   * 首先生成一个二维数组stage，第三位都填0，表示空位
   * 然后每次下子都时候，
   *      修改对应位置的stage
   *      根据下子的颜色调用isWin方法
   *
   * */

  // todo 灰色的线上加一个白色的棋子的时候，会有视觉残留

  constructor (stageContainer, gridSize) {
    if (!document) throw new Error('Program must run in a html file.')
    if (gridSize < 10) throw new RangeError('grid size is too small')
    if (stageContainer.nodeType !== 1) throw new TypeError('stage container must be an DOM element.')
    this._canvas = document.createElement('canvas')
    this.stageContext = this._canvas.getContext('2d')
    stageContainer.append(this._canvas)
    this.gridSize = gridSize || 15
    this.stage = this.buildStage(this.gridSize)
    // this.stage = {
    //   "0,0":0,"0,1":0,"0,2":0,"0,3":0,"0,4":0,"0,5":0,"0,6":0,"0,7":0,"0,8":0,"0,9":0,"0,10":0,"0,11":0,"0,12":0,"0,13":0,"0,14":0,
    //   "1,0":0,"1,1":0,"1,2":0,"1,3":0,"1,4":0,"1,5":0,"1,6":0,"1,7":0,"1,8":0,"1,9":0,"1,10":0,"1,11":0,"1,12":0,"1,13":0,"1,14":0,
    //   "2,0":0,"2,1":0,"2,2":0,"2,3":0,"2,4":0,"2,5":0,"2,6":0,"2,7":0,"2,8":0,"2,9":0,"2,10":0,"2,11":0,"2,12":0,"2,13":0,"2,14":0,
    //   "3,0":0,"3,1":0,"3,2":0,"3,3":0,"3,4":0,"3,5":0,"3,6":0,"3,7":0,"3,8":0,"3,9":0,"3,10":0,"3,11":0,"3,12":0,"3,13":0,"3,14":0,
    //   "4,0":0,"4,1":0,"4,2":0,"4,3":0,"4,4":0,"4,5":0,"4,6":0,"4,7":0,"4,8":0,"4,9":0,"4,10":0,"4,11":0,"4,12":0,"4,13":0,"4,14":0,
    //   "5,0":0,"5,1":0,"5,2":0,"5,3":0,"5,4":0,"5,5":0,"5,6":0,"5,7":0,"5,8":0,"5,9":0,"5,10":2,"5,11":1,"5,12":0,"5,13":0,"5,14":0,
    //   "6,0":0,"6,1":0,"6,2":0,"6,3":0,"6,4":0,"6,5":0,"6,6":0,"6,7":0,"6,8":0,"6,9":0,"6,10":2,"6,11":1,"6,12":0,"6,13":0,"6,14":0,
    //   "7,0":0,"7,1":0,"7,2":0,"7,3":0,"7,4":0,"7,5":0,"7,6":0,"7,7":0,"7,8":0,"7,9":0,"7,10":2,"7,11":1,"7,12":0,"7,13":0,"7,14":0,
    //   "8,0":0,"8,1":0,"8,2":0,"8,3":0,"8,4":0,"8,5":0,"8,6":0,"8,7":0,"8,8":0,"8,9":0,"8,10":2,"8,11":1,"8,12":0,"8,13":0,"8,14":0,
    //   "9,0":0,"9,1":0,"9,2":0,"9,3":0,"9,4":0,"9,5":0,"9,6":0,"9,7":0,"9,8":0,"9,9":0,"9,10":0,"9,11":1,"9,12":0,"9,13":0,"9,14":0,
    //   "10,0":0,"10,1":0,"10,2":0,"10,3":0,"10,4":0,"10,5":0,"10,6":0,"10,7":0,"10,8":0,"10,9":0,"10,10":0,"10,11":0,"10,12":0,"10,13":0,"10,14":0,
    //   "11,0":0,"11,1":0,"11,2":0,"11,3":0,"11,4":0,"11,5":0,"11,6":0,"11,7":0,"11,8":0,"11,9":0,"11,10":0,"11,11":0,"11,12":0,"11,13":0,"11,14":0,
    //   "12,0":0,"12,1":0,"12,2":0,"12,3":0,"12,4":0,"12,5":0,"12,6":0,"12,7":0,"12,8":0,"12,9":0,"12,10":0,"12,11":0,"12,12":0,"12,13":0,"12,14":0,
    //   "13,0":0,"13,1":0,"13,2":0,"13,3":0,"13,4":0,"13,5":0,"13,6":0,"13,7":0,"13,8":0,"13,9":0,"13,10":0,"13,11":0,"13,12":0,"13,13":0,"13,14":0,
    //   "14,0":0,"14,1":0,"14,2":0,"14,3":0,"14,4":0,"14,5":0,"14,6":0,"14,7":0,"14,8":0,"14,9":0,"14,10":0,"14,11":0,"14,12":0,"14,13":0,"14,14":0
    // }
    // 棋盘样式控制
    this.padding = 8
    this.cellWidth = 24
    this.nodeRadius = this.cellWidth / 2 - 2 //  棋子的半径
    this.nodeColors = [['#d1d1d1', '#f9f9f9'], ['#0a0a0a', '#636766']]
    // 默认没有结束比赛
    this.isWin = false
    // 撤销用数组, 固定长度为5
    this.queue = []
    // 撤销删除的数据，以备之后回撤使用
    this.undoedSteps = []
    // 撤销步数，主要是为了撤销撤销用的
    this.undoStep = 0
    // 先默认白棋先手
    this.currentMoveRole = 2
    // 游戏模式：p2p， p2c
    this.gameMode = 'p2p'
    this._canvas.onclick = this.handleClick.bind(this)
    this.generateStage()
  }

  updateStage (row, col, nodeType) {
    this.stage[[row, col].toString()] = nodeType
  }

  undo (role) {
    // 撤销操作

    const reversedQ = this.queue.reverse()
    const index = reversedQ.findIndex(i => i.role === role)
    this.undoedSteps = this.undoedSteps.concat(this.queue.slice(index, -1))
    this.queue = this.queue.splice(0, index)

    console.log(this.queue)
    console.log(this.undoedSteps)
    // this.undoStep += step
    // if (this.undoStep > 5) this.undoStep = 5
    // if (this.undoStep < 5) this.undoStep = 0
    // if (this.queue.length) {
    //   this.stage = this.queue[this.undoStep]
    // }
  }

  buildStage (gridSize) {
    // const stage = [];
    const stageMap = {}
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // stage.push([i, j, 0]);
        stageMap[[i, j].toString()] = 0
      }
    }
    return stageMap
  };

  checkWin (nodeType) {
    for (let nodeRowIndex = 0; nodeRowIndex < this.gridSize; nodeRowIndex++) {
      for (let nodeColIndex = 0; nodeColIndex < this.gridSize; nodeColIndex++) {
        const nodeValue = this.stage[[nodeRowIndex, nodeColIndex].toString()]
        if (nodeValue !== nodeType) continue
        // 数字代表角度，下划线代表正负
        const arr0 = [nodeValue]
        const arr45 = [nodeValue]
        const arr_45 = [nodeValue]
        const arr_90 = [nodeValue]
        for (let i = 1; i < 5; i++) {
          arr0.push(this.stage[[nodeRowIndex + i, nodeColIndex].toString()])
          arr45.push(this.stage[[nodeRowIndex + i, nodeColIndex - i].toString()])
          arr_45.push(this.stage[[nodeRowIndex - i, nodeColIndex + i].toString()])
          arr_90.push(this.stage[[nodeRowIndex, nodeColIndex + i].toString()])
        }

        if (arr0.every(i => i === nodeType) || arr45.every(i => i === nodeType) || arr_45.every(i => i === nodeType) || arr_90.every(i => i === nodeType)) {
          this.isWin = true
          break
        }
      }
    }
  }

  handleClick (e) {
    // 获取点击的坐标
    let {offsetX: x, offsetY: y} = e
    // 获取点击坐标附近的交叉点
    let nodeX = Math.floor(x / this.cellWidth)
    let nodeY = Math.floor(y / this.cellWidth)
    if (this.stage[[nodeX, nodeY].toString()] === 0) {
      // 当前是空位
      this.dropANode(nodeX, nodeY, this.currentMoveRole)
      // 往撤销队列里push一个当前对象
      // todo 这里只需要push 坐标就行了和角色归属
      this.queue.push({role: this.currentMoveRole, position: [nodeX, nodeY].toString()})
      // 更新当前model
      this.updateStage(nodeX, nodeY, this.currentMoveRole)
      // 检测是不是游戏结束
      this.checkWin(this.currentMoveRole)
      if (this.isWin) {
        console.log(1)
      } else {
        // 切换角色
        if (this.gameMode === 'p2p') {
          this.currentMoveRole = this.currentMoveRole === 1 ? 2 : 1
        } else {
          this.AI()
        }
      }

    }
  }

  AI () {
    // todo AI
    this.currentMoveRole = this.currentMoveRole === 1 ? 2 : 1
  }

  generateStage () {
    /**
     * 绘制棋盘
     *
     * */
    this._canvas.width = this.cellWidth * (this.gridSize - 1) + this.padding * 2
    this._canvas.height = this.cellWidth * (this.gridSize - 1) + this.padding * 2
    this.stageContext.strokeStyle = '#bfbfbf'
    const contentWidth = this.cellWidth * (this.gridSize - 1) + this.padding
    for (let i = 0; i < this.gridSize; i++) {
      this.stageContext.moveTo(this.padding + i * this.cellWidth, this.padding)
      this.stageContext.lineTo(this.padding + i * this.cellWidth, contentWidth)
      this.stageContext.stroke()
      this.stageContext.moveTo(this.padding, this.padding + i * this.cellWidth)
      this.stageContext.lineTo(contentWidth, this.padding + i * this.cellWidth)
      this.stageContext.stroke()
    }
  }

  dropANode (x, y, nodeType) {
    /**
     * 画一个棋子
     * @param {number} nodeType 只能为1或者2
     * */
    const nodeColors = this.nodeColors
    this.stageContext.beginPath()
    this.stageContext.arc(this.padding + x * this.cellWidth, this.padding + y * this.cellWidth, this.nodeRadius, 0, 2 * Math.PI)
    // 开始圆的x，y，r 结束圆的x，y，r。2是控制高光的地方不在棋子正中央
    const gradient = this.stageContext.createRadialGradient(this.padding + x * this.cellWidth + 2, this.padding + y * this.cellWidth - 2, this.nodeRadius, this.padding + x * this.cellWidth + 2, this.padding + y * this.cellWidth - 2, 0)
    if (nodeType === 1) {
      gradient.addColorStop(0, nodeColors[0][0])
      gradient.addColorStop(1, nodeColors[0][1])
    } else {
      gradient.addColorStop(0, nodeColors[1][0])
      gradient.addColorStop(1, nodeColors[1][1])
    }
    this.stageContext.fillStyle = gradient
    this.stageContext.fill()
  }

  clearANode (x, y) {
    /**
     * 删除一个棋子
     * */
    //擦除该圆
    this.stageContext.clearRect((x) * this.cellWidth, (y) * this.cellWidth, this.cellWidth, this.cellWidth)
    // 重画该圆周围的格子
    this.stageContext.beginPath()
    this.stageContext.moveTo(this.padding + x * this.cellWidth, y * this.cellWidth)
    this.stageContext.lineTo(this.padding + x * this.cellWidth, y * this.cellWidth + this.cellWidth)
    this.stageContext.moveTo(x * this.cellWidth, y * this.cellWidth + this.padding)
    this.stageContext.lineTo((x + 1) * this.cellWidth, y * this.cellWidth + this.padding)

    this.stageContext.stroke()
  }
}
