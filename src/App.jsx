import { useState, useEffect, useRef } from 'react'
import { getAnimProps, petList } from './pet_codex.js'
import { Pet } from './Pet.js'

import APIHelper from './components/APIHelper.jsx'
import Eggs from './components/Eggs.jsx'
import PetElement from './components/PetElement.jsx'
import NewPetButton from './components/NewPetButton.jsx'
import set from "./sprites/set.svg";
import NeedBar from './components/NeedBar.jsx'
import EnterName from './components/EnterName.jsx'
import LoginForm from './components/LoginForm.jsx'
import { useSpring, animated, easings } from 'react-spring'
import './app.css'
import { config as gConfig } from './GameConfig.js'
import PetStorage from './components/APIHelper.jsx'


function App() {

  const [activeUser, setActiveUser] = useState(null)

  const [activePet, setActivePet] = useState(null);

  const [petPosition, setPetPosition] = useState({ x: 50, y: 50 });
  const [targetPetPosition, setTargetPetPosition] = useState({ x: 50, y: 50 });
  let randomWander = useRef(10);

  const [secondsPassed, setSecondsPassed] = useState(0);
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const [petName, setPetName] = useState('');

  const [prompt, setPrompt] = useState('');
  let promptFade = useRef(0);

  const [showEmotion, setShowEmotion] = useState(false)
  let emotionFade = useRef(0);

  const [adminPanel, setAdminPanel] = useState(false);

  useInterval(passTime, 1000);

  function login(inputUsername, inputPassword) {
    const API_LOGIN = 'http://localhost:8080/login';

    const loginJSON = JSON.stringify({
      username: inputUsername,
      password: inputPassword
    })

    fetch(API_LOGIN, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: loginJSON
    }).then(res => {
      if (res != 'failed') {
        setActivePet(res)
        setActiveUser(inputUsername)
      } else {
        setActivePet(null)
        setPrompt("Login failed");
      }
    });

  }

  function logout() {
    setActiveUser(null);
    setActivePet(null);
  }

  function register(inputUsername, inputPassword) {

    const API_REGISTER = 'http://localhost:8080/createUser';

    const json = JSON.stringify(
      {
        username: inputUsername,
        password: inputPassword,
        petJSON: activePet ? activePet : ""
      }
    )
    fetch(API_REGISTER, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: json
    }).then(res => {
      if (res = 'success') {
        setActiveUser(inputUsername)
        setPrompt("Registered!");
      } else {

        setPrompt("Registration failed");
      }
    });

  }

  function createPet(type) {

    let newPet = new Pet(type, 'egg');
    setActivePet(newPet);
    setPrompt("Click egg to hatch")
  }


  function closeModal() {
    setModalIsOpen(false);
  }
  function openModal() {
    setModalIsOpen(true);
  }

  function emotionBubble(duration) {

    if (activePet.isAlive && activePet.age != 'egg') {
      setShowEmotion(true)
      emotionFade.current = duration
    }
  }

  //https://overreacted.io/making-setinterval-declarative-with-react-hooks/
  function useInterval(callback, delay) {
    const savedCallback = useRef();

    // Remember the latest callback.
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
      function tick() {
        savedCallback.current();
      }
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  }

  function resetPet() {
    setPetPosition({ x: 50, y: 50 });
    setPrompt('')
    setPetName('')
    setActivePet(null);
    setModalIsOpen(false);
    setShowEmotion(false)
    emotionFade.current = 0;
  }

  function hatchEgg(egg) {
    console.log('hatching')
    setModalIsOpen(true);
    setPrompt('')
    const newPet = {
      ...egg,
      age: nextAge(egg.age)
    }
    updateSpriteAnimations(newPet);

  }

  function growPet() {

    if (activePet.age === "egg") {
      hatchEgg(activePet);
      return
    }

    if (activePet.age === "adult") {
      petDie(activePet);
      return
    }

    const newPet = {
      ...activePet,
      age: nextAge(activePet.age),
    };
    //newPet is passed this way because otherwise the following function would overwrite changes
    updateSpriteAnimations(newPet);

  }

  function nextAge(age) {
    let newAge
    switch (age) {
      case 'egg':
        newAge = 'baby';
        break;
      case 'baby':
        newAge = 'teen';
        break;
      case 'teen':
        newAge = 'adult';
        break;
      case 'adult':
        newAge = 'dead';
        break;
      case 'dead':
        newAge = 'dead';
        break;
    }
    return newAge

  }

  function getEmotion() {
    let newEmotion = 'okay'

    if ((activePet.food + activePet.fun >= 17)
      && activePet.food >= 7
      && activePet.fun >= 7) {
      newEmotion = 'happy'
      return newEmotion
    }
    if (activePet.food + activePet.fun >= 12) {
      newEmotion = 'content'
      return newEmotion
    }
    if (activePet.food + activePet.fun >= 9) {
      newEmotion = 'okay'
      return newEmotion
    }
    if (activePet.fun <= 4 && activePet.food > 3) {
      newEmotion = 'bored'
      return newEmotion
    }
    if (activePet.food <= 3 || activePet.fun <= 3) {
      newEmotion = 'sad'
      return newEmotion
    }
    return newEmotion
  }

  //Name pet entered name or give it a default name
  function namePet(newName) {

    if (newName === 'default') {
      newName = activePet.type
    }

    setActivePet({
      ...activePet,
      name: newName
    })
    setPetName(newName)

  }

  function feedPet(foodValue) {
    const currentHunger = activePet.food
    let newFood
    if ((currentHunger + foodValue) > activePet.maxFood) {
      newFood = activePet.maxFood
    } else {
      newFood = currentHunger + foodValue
    }
    const newPet = {
      ...activePet,
      food: newFood,
      emotion: getEmotion()
    }

    updateSpriteAnimations(newPet)
    emotionBubble(4);
  }

  function entertainPet(funValue) {
    const currentFun = activePet.fun;
    let newFun
    if ((currentFun + funValue) > activePet.maxFun) {
      newFun = activePet.maxFun;
    } else {
      newFun = currentFun + funValue;
    }
    const newPet = {
      ...activePet,
      fun: newFun,
      emotion: getEmotion(2)
    }

    updateSpriteAnimations(newPet)
    emotionBubble(4);
  }

  function petDie(unfortunatePet) {
    const newPet = {
      ...unfortunatePet,
      age: 'dead',
      isAlive: false,
      food: 0,
      fun: 0
    }
    setPrompt(`${activePet.name ? activePet.name : 'pet'}` + " has died :(")
    updateSpriteAnimations(newPet);
    setModalIsOpen(false);
    setPetPosition({ x: 50, y: 50 });
    setTargetPetPosition({ x: 50, y: 50 });
  }

  function passTime() {

    let grow = false
    let decayFood = false
    let decayFun = false
    let changeEmotion = false

    //There needs to be a pet that is alive
    if (activePet && activePet.isAlive) {
      const newTime = activePet.secondsAlive + 1;
      setSecondsPassed(newTime);

      let newPet = {
        ...activePet,
        secondsAlive: newTime
      }

      //Food and fun should not decay if pet is still an egg
      if (activePet.age !== 'egg') {

        if (newTime % activePet.foodDecayRate === 0) {
          decayFood = true
        }

        if (newTime % activePet.funDecayRate === 0) {
          decayFun = true
        }

        if (newTime % randomWander.current === 0) {

          wander();

          newPet = {
            ...newPet,
            doing: 'run'
          }

          setActivePet(newPet);

        }
      }

      if (newTime % activePet.growthRate === 0) {
        grow = true
      }

      //If any value tied to happiness is changed, update the emotion to match
      if (decayFun || decayFood) {
        changeEmotion = true
      }

      updatePet(newPet, grow, decayFood, decayFun, changeEmotion);

      //Prompt
      if (promptFade.current) {
        promptFade.current -= 1;
      }

      if (promptFade.current <= 0) {
        setPrompt('')
      }

      if (emotionFade.current > 0) {
        // setEmotionFade(emotionFade - 1)
        emotionFade.current -= 1

      }

      if (emotionFade.current <= 0) {
        setShowEmotion(false)
        emotionFade.current = 0
      }
    }
  }

  //Used to update several pet variables at once, from passTime usually
  function updatePet(petToUpdate, grow, decayFood, decayFun, changeEmotion) {
    let newPet = { ...petToUpdate }

    if (grow) {

      let newAge = nextAge(newPet.age);

      if (newAge === 'baby') {
        hatchEgg(newPet)
        return
      }

      if (newAge === 'dead') {
        petDie(newPet)
        return
      }

      newPet = {
        ...newPet,
        age: newAge
      }
    }

    if (decayFood) {
      newPet = {
        ...newPet,
        food: newPet.food - newPet.foodDecay
      }
    }

    if (decayFun) {
      newPet = {
        ...newPet,
        fun: newPet.fun - newPet.funDecay
      }
    }

    if (newPet.food <= 0 || newPet.fun <= 0) {
      petDie(newPet);
      return
    }

    if (changeEmotion) {
      newPet = {
        ...newPet,
        emotion: getEmotion()
      }
    }
    updateSpriteAnimations(newPet);
  }

  //Should always be used to update pet, 
  function updateSpriteAnimations(newPet, newActiveSprite) {
    const age = newPet.age
    //Get the appropriate sprites for the current pet
    const pet = petList.find(pet => pet.type === newPet.type);
    const newIdle = pet[age].idle
    const newHatching = pet[age].hatching
    const newRun = pet[age].run;

    let newActive = newIdle
    if (newActiveSprite) {
      newActive = newActiveSprite
    }

    const newAnimProps = getAnimProps(age);

    setActivePet({
      ...newPet, // Copy the old fields
      idle: newIdle,
      hatching: newHatching,
      run: newRun,
      activeSprite: newActive,
      animProps: newAnimProps,
    });
  }


  const move = useSpring({
    config: { duration: targetPetPosition.duration },
    from: {
      position: 'absolute',
      transform: `translate(-50%, -50%) rotateY(${targetPetPosition.facingRight ? 0 : 180}deg)`,
      top: `${petPosition.y}%`,
      left: `${petPosition.x}%`
    },
    to: {
      position: 'absolute',
      transform: `translate(-50%, -50%) rotateY(${targetPetPosition.facingRight ? 0 : 180}deg)`,
      top: `${targetPetPosition.y}%`,
      left: `${targetPetPosition.x}%`,
    },
    onRest: () => (setIdleSprite())
  })

  function solveDuration(newX, newY, oldPosition, speed) {
    let distanceX = newX - oldPosition.x
    let distanceY = newY - oldPosition.y

    if (distanceX < 0) {
      distanceX = distanceX * -1
    }
    if (distanceY < 0) {
      distanceY = distanceY * -1
    }

    //calculate distance using pythagorean theorem
    let distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2))

    //duration equals distance/speed
    const duration = distance / speed;
    return duration;
  }

  function wander() {

    //Generate a random position within the centre of the game grid
    const newX = Math.floor(Math.random() * (100 - gConfig.wanderXBound * 2)) + gConfig.wanderXBound;
    const newY = Math.floor(Math.random() * (100 - gConfig.wanderYBound * 2)) + gConfig.wanderYBound;

    //calculate the distance between the pet and the target position

    const duration = solveDuration(newX, newY, petPosition, activePet.speed);
    runTo(newX, newY, duration * 1000);
  }

  function runTo(targetX, targetY, dur) {

    let newFacingRight = true
    if (targetX < petPosition.x) {
      newFacingRight = false
    } else {
      newFacingRight = true
    }

    setTargetPetPosition({
      ...targetPetPosition,
      x: targetX,
      y: targetY,
      duration: dur,
      facingRight: newFacingRight
    })
  }

  function setIdleSprite() {
    const newPet = {
      ...activePet,
      doing: 'idle'
    }
    let randomBoundNumber = Math.floor(Math.random() * (gConfig.wanderFreqUpper - gConfig.wanderFreqLower + 1)) + gConfig.wanderFreqLower
    // setRandomWander(randomBoundNumber)
    randomWander.current = randomBoundNumber
    setActivePet(newPet);
  }

  return (
    <div className="App site-wrapper" >

      <div className="game-wrapper">

        {/* GAME ACTIONS */}
        <nav className={`top-bar `}>
          {activePet ? <>
            {/* <img src={activePet.activeSprite} alt="" /> */}

            <div className={`needs ${activePet.age != 'egg' ? 'visible' : ''}`}>
              <NeedBar need={activePet.food} needMax={activePet.maxFood} icon={'🍏'} />
              <NeedBar need={activePet.fun} needMax={activePet.maxFun} icon={'❤️'} />
            </div>
            <div className={`need-buttons ${activePet.age != 'egg' ? 'visible' : ''}`}>
              <div className="foods">
                <button onClick={() => feedPet(1)}>🍏</button>
                <button onClick={() => feedPet(1)}>🥥</button>
                <button onClick={() => feedPet(2)}>🌮</button>
                <button onClick={() => feedPet(3)}>🍔</button>
              </div>
              <div className="funs">
                <button onClick={() => entertainPet(1)}>Pet❤️</button>
                <button onClick={() => entertainPet(2)}>🍬</button>
                <button onClick={() => entertainPet(3)}>🍫</button>
              </div>
            </div>

          </>
            :
            <></>}
        </nav>

        {/* GAME  */}

        <div style={{ backgroundImage: `url(${set})` }}
          className='game-grid'>

          {activePet ? <>
            <animated.div style={move}>
              <PetElement activePet={activePet}
                hatchEgg={() => hatchEgg(activePet)}
                showEmotion={showEmotion}
              />

            </animated.div>
            <NewPetButton isAlive={activePet.isAlive} resetPet={resetPet} />
          </>
            :
            <Eggs createPet={createPet} />
          }
          <EnterName modalIsOpen={modalIsOpen} namePet={namePet} closeModal={closeModal}></EnterName>

          {prompt && <p className='prompt'>{prompt}</p>}
          {petName && <p className='pet-name'>{petName}</p>}
        </div>

        {/* ADMIN PANEL */}
        {adminPanel && activePet ? <>
          <nav className='admin-panel'>

            <button onClick={() => resetPet()}>New pet</button>
            <button onClick={() => growPet()}>Grow pet</button>
            <button onClick={() => setModalIsOpen(!modalIsOpen)}>Name pet</button>
            <button onClick={() => petDie(activePet)}>Die</button>
            <button onClick={() => setAdminPanel(false)}>X</button>
            <p>Time alive: {secondsPassed}</p>
            <p>is feeling {activePet.emotion}</p>
            <p>{activePet.name ? activePet.name : 'this'} is a {activePet.age} {activePet.type}</p>
          </nav>
        </>
          :
          <button onClick={() => setAdminPanel(true)}>Admin Panel</button>
        }
        <APIHelper showButtons={true}
          activePet={activePet}
          setPrompt={setPrompt}
          setActivePet={setActivePet}
          promptFade={promptFade}
          activeUser={activeUser}
        />

        {/* {activeUser ? <button onClick={logout}>Logout</button>
        : <LoginForm login={login} register={register} />} */}
      </div>

    </div>
  )

}

export default App
