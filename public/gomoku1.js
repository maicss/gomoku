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
    this._canvas = stageContainer
    this.stageContext = this._canvas.getContext('2d')
    this.gridSize = gridSize || 15
    this.stage = this.buildStage(this.gridSize)
    this.padding = 12
    this.cellWidth = 24
    this.nodeRadius = this.cellWidth / 2 - 2 //  棋子的半径
    this.nodeColors = [['#d1d1d1', '#f9f9f9'], ['#0a0a0a', '#636766']]
    // 默认没有结束比赛
    this.isWin = false
    // 撤销用数组, 固定长度为5
    this.queue = []
    // 撤销删除的数据，以备之后回撤使用
    this.undoedSteps = []
    // 先默认白棋先手
    this.currentMoveRole = 2
    // 游戏模式：p2p， p2c
    this.gameMode = 'p2p'
    // this._canvas.onclick = this.handleClick.bind(this)
    this.generateStage()
  }

  updateStage (row, col, nodeType) {
    this.stage[[row, col].toString()] = nodeType
  }

  undo (role) {
    // 撤销操作
    // console.log(JSON.stringify(this.queue))
    const rIndex = this.queue.reverse().findIndex(i => i.role === role)
    const index = this.queue.length - 1 - rIndex
    this.queue.reverse()
    // 这个的长度最大为2，最小为0，一般为1
    const _undos = this.queue.slice(index, this.queue.length)
    this.undoedSteps = this.undoedSteps.concat(_undos)
    this.queue = this.queue.splice(0, index)
    // console.log(JSON.stringify(this.undoedSteps))
    // console.log(JSON.stringify(this.queue))
    _undos.forEach(step => this.clearANode(Number(step.position.split(',')[0]), Number(step.position.split(',')[1])))
  }

  redo (role) {
    /**
     * 撤销撤销
     * */
      // console.log("=".repeat(50))
    const rIndex = this.undoedSteps.reverse().findIndex(i => i.role === role)
    const index = this.undoedSteps.length - 1 - rIndex
    this.undoedSteps.reverse()
    const _redos = this.undoedSteps.slice(index, this.undoedSteps.length)
    this.queue = this.queue.concat(_redos)
    this.undoedSteps = this.undoedSteps.splice(0, index)
    // console.log(JSON.stringify(this.undoedSteps))
    // console.log(JSON.stringify(this.queue))
    _redos.forEach(step => this.dropANode(Number(step.position.split(',')[0]), Number(step.position.split(',')[1]), step.role))
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
    // console.log(x, y)
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
    this.stageContext.clearRect(x * this.cellWidth - 2, y * this.cellWidth - 2, this.cellWidth, this.cellWidth)
    // 重画该圆周围的格子
    // todo 重新绘制后颜色变浅
    this.stageContext.beginPath()
    if (y === 0) {
      this.stageContext.moveTo(this.padding + x * this.cellWidth, this.padding)
    } else {
      this.stageContext.moveTo(this.padding + x * this.cellWidth, y * this.cellWidth - 2)
    }
    if (y === 14) {
      this.stageContext.lineTo(this.padding + x * this.cellWidth, y * this.cellWidth + this.padding)
    } else {
      this.stageContext.lineTo(this.padding + x * this.cellWidth, (y + 1) * this.cellWidth)
    }

    this.stageContext.stroke()

    if ( x === 0) {
      this.stageContext.moveTo(x * this.cellWidth - 2 + this.padding, y * this.cellWidth + this.padding)
    } else {
      this.stageContext.moveTo(x * this.cellWidth - 2, y * this.cellWidth + this.padding)
    }
    if (x === 14) {
      this.stageContext.lineTo(x * this.cellWidth + this.padding, y * this.cellWidth + this.padding)
    } else {
      this.stageContext.lineTo((x + 1) * this.cellWidth, y * this.cellWidth + this.padding)
    }
    this.stageContext.stroke()
    // 重置该点数据和当前角色
    this.stage[[x, y].toString()] = 0
    this.currentMoveRole = this.currentMoveRole === 1 ? 2 : 1
  }
}
