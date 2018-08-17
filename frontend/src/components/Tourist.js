import React, { Component } from 'react'
import { connect } from 'react-redux'

import { horizonLine, initialPlayerSize, playerStartY, canvasHeight, nearnessSpook } from '../setupData'
import { addTouristToGarbage, addTouristToRoaster, removeTouristFromRoaster, resetPlayer, decreaseLife, recordStreak } from '../actions'

const Tourist = class extends Component {
  state = {
    positionX: null,
    positionY: null,
    initialRow: null,
    initialCol: null,
    positionOnArray: null,
    walkingCycle: 0,
    initialSize: null,
    image: Math.trunc(Math.random() * 3),
    images: ['../touristA.png', '../tourist2.png', '../tourist3.png'],
    dontCallBumpAgain: false,
    mountedOnMovement: null
  }

  findAngle = () => {
    const lengthOfGroundTriangle = this.props.canvas.height - this.horizonPosition
    const widthOfGroundTriangle = this.props.canvas.width/2

    const sideOfPath = Math.sqrt(Math.pow(lengthOfGroundTriangle, 2) + Math.pow(widthOfGroundTriangle, 2))
    const numerator = (2 * Math.pow(sideOfPath, 2)) - Math.pow(this.props.canvas.width, 2)
    const denominator = (2 * Math.pow(sideOfPath, 2))

    return Math.acos(numerator/denominator)
  }

  static getDerivedStateFromProps(props, state) {
    let chosenRow, chosenCol, positionX, positionY, startingSize, initialRow, initialCol, mountedOnMovement
    const percentageOfRows = 0.10

    if (state.positionOnArray === null && props.centersOfBricks.length > 0) {
      initialRow = chosenRow = Math.trunc(Math.trunc(Math.random()*(props.centersOfBricks.length-1)) * percentageOfRows)
      initialCol = chosenCol = Math.trunc(Math.random()*(props.centersOfBricks[0].length-1))
      positionX = props.centersOfBricks[chosenRow][chosenCol].x
      positionY = props.centersOfBricks[chosenRow][chosenCol].y
      startingSize = (positionY - horizonLine) * ((initialPlayerSize)/(playerStartY - horizonLine))
      mountedOnMovement = props.movement
    } else if (state.positionOnArray !== null ) {
      try {
        initialRow = state.initialRow
        initialCol = state.initialCol
        // 0.5 because each cycle of bricks involves two rows since adjacent rows are not similar in style
        const brickTransitionHelper = (Math.trunc(props.movementPerBrick * (props.movement) * 0.5) * 2) - (Math.trunc(props.movementPerBrick * (state.mountedOnMovement) * 0.5) * 2)
        chosenRow = (state.initialRow + brickTransitionHelper ) % props.centersOfBricks.length
        chosenCol = state.positionOnArray.col
        positionX = props.centersOfBricks[chosenRow][chosenCol].x
        positionY = props.centersOfBricks[chosenRow][chosenCol].y
        startingSize = state.startingSize
        mountedOnMovement = state.mountedOnMovement
      } catch (err) {
        debugger
      }
    } else {
      return state
    }
    return {
      ...state,
      positionX: positionX,
      positionY: positionY,
      initialRow: initialRow,
      initialCol: initialCol,
      positionOnArray: {col: chosenCol, row: chosenRow},
      initialSize: startingSize,
      mountedOnMovement: mountedOnMovement
    }

  }

  howBigShouldIBe = () => {
    return (this.state.positionY - horizonLine) * ((initialPlayerSize)/(playerStartY - horizonLine))
  }

  static pythagoreanHelper = (a, b) => {
    return Math.sqrt(Math.pow(a,2) + Math.pow(b,2))
  }

  checkForCollision = () => {
    const sizeOfSide = this.howBigShouldIBe()

    const lowerLeftTourist = {x: this.state.positionX, y: this.state.positionY + sizeOfSide}
    const lowerRightTourist = {x: this.state.positionX + sizeOfSide, y: this.state.positionY + sizeOfSide}
    const lowerLeftPlayer = {x: this.props.playerX, y: this.props.playerY + initialPlayerSize}
    const lowerRightPlayer = {x: this.props.playerX + initialPlayerSize, y: this.props.playerY + initialPlayerSize}

    let bumpOnTheLeft = (lowerLeftPlayer.x >= lowerLeftTourist.x && lowerLeftPlayer.x <= lowerRightTourist.x) && (Math.abs(lowerLeftPlayer.y - lowerLeftTourist.y) < nearnessSpook)
    let bumpOnTheRight = (lowerRightPlayer.x >= lowerLeftTourist.x && lowerRightPlayer.x <= lowerRightTourist.x) && (Math.abs(lowerLeftPlayer.y - lowerLeftTourist.y) < nearnessSpook)
    if ( (bumpOnTheLeft || bumpOnTheRight) && !this.state.dontCallBumpAgain ) {
      console.log("BUMP ACTIVATED " + this.props.id)
      // fix DOM manipulation later
      document.querySelector("#bumpSoundEl").play()
      // fix DOM manipulation later
      // this.props.moveDown() <--- causes stack overflow inifinite
      this.setState({dontCallBumpAgain: true}, () => {
        this.props.recordStreak(this.props.movement)
        this.props.resetPlayer()
        this.props.decreaseLife()
      })
    }
  }

  checkIfTouristStillInView = () => {
    if (this.state.positionY) {
      if (this.state.positionY > (canvasHeight - (initialPlayerSize/2))) {
        this.props.addTouristToGarbage(this.props.id)
      }
    }
  }

  componentDidMount() {
    console.log("TOURIST MOUNTED  " + this.state.positionX + ", " + this.state.positionY)

    // fix DOM manipulation later
    const bumpSoundEl = document.createElement("audio")
    bumpSoundEl.setAttribute("id", "bumpSoundEl")
    bumpSoundEl.src = "../bump.wav"
    document.head.appendChild(bumpSoundEl)
    // fix DOM manipulation later

    this.refs.touristImg.onload = () => {
      const sizeOfSide = this.state.initialSize
      try {
        this.props.canvas.getContext("2d").drawImage(this.refs.touristImg, this.state.positionX, this.state.positionY, sizeOfSide, sizeOfSide)
        this.props.addTouristToRoaster(this)
      } catch (err) {
        console.log("CANVAS ERROR BYPASSED")
      }
    }
  }


  componentDidUpdate(prevProps, prevState, snapshot) {
    console.log("TOURIST FIRST UPDATE " + this.state.mountedOnMovement)
    // console.log(`TOURIST ${this.props.id} MOUNTED at ${this.state.positionX}, ${this.state.positionY}`)
    const sizeOfSide = this.howBigShouldIBe()
    try {
      this.props.canvas.getContext("2d").drawImage(this.refs.touristImg, this.state.positionX, this.state.positionY, sizeOfSide, sizeOfSide)
    } catch(err) {
      debugger
    }
    this.checkForCollision()
    this.checkIfTouristStillInView()
  }

  componentWillUnmount() {
    console.log(`TOURIST ${this.props.id} UNMOUNTED`)
    this.props.removeTouristFromRoaster(this.props.id)
  }

  render() {
    return <img src={`${this.state.images[this.state.image]}`} ref='touristImg' className='hidden' alt='tourist'/>
  }
}

const mapStateToProps = (state) => {
  return {
    canvas: state.canvas,
    initialPeopleSizes: state.initialPeopleSizes,
    movement: state.movement,
    distance: state.distance,
    playerX: state.player.xPosition,
    playerY: state.player.yPosition,
    centersOfBricks: state.centersOfBricks,
    movementPerBrick: state.movementPerBrick,
    lives: state.lives
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    addTouristToRoaster: (tourist) => dispatch(addTouristToRoaster(tourist)),
    removeTouristFromRoaster: (id) => dispatch(removeTouristFromRoaster(id)),
    addTouristToGarbage: (id) => dispatch(addTouristToGarbage(id)),
    resetPlayer: () => dispatch(resetPlayer()),
    decreaseLife: () => dispatch(decreaseLife()),
    recordStreak: (streak) => dispatch(recordStreak(streak))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Tourist)
