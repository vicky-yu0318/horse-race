import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import _ from "lodash";
import horse from "./images/horse.png";

const horseCount = 7;
const baseSpeed = 200; // ms per frame
const trackLength = window.innerWidth - 30;
console.log("trackLength :>> ", trackLength);

function App() {
  const [positions, setPositions] = useState(Array(horseCount).fill(0));
  const [bet, setBet] = useState(null);
  const [winner, setWinner] = useState(null);
  const intervalRefs = useRef([]);

  useEffect(() => {
    if (positions.every((pos) => pos >= trackLength) && winner) {
      if (bet === winner) {
        alert(`你猜對了，是 ${winner + 1} 號馬兒跑最快`);
      } else {
        alert(`你賭注輸了，是 ${winner + 1} 號馬兒跑最快`);
      }
    }
  }, [winner, bet, positions]);

  const startRace = () => {
    intervalRefs.current.forEach(clearInterval);
    let isFirst = false;
    intervalRefs.current = positions.map((pos, index) => {
      const runDistance = pos + Math.random() * 50;
      return setInterval(() => {
        setPositions((prevPositions) => {
          const newPositions = [...prevPositions];
          newPositions[index] =
            runDistance + newPositions[index] > trackLength
              ? trackLength
              : runDistance + newPositions[index];

          // console.log("newPositions :>> ", newPositions);
          if (newPositions[index] >= trackLength) {
            clearInterval(intervalRefs.current[index]);

            if (!winner && !isFirst) {
              isFirst = true;
              setWinner(index);
            }
          }
          return newPositions;
        });
      }, baseSpeed);
    });
  };

  const handleBet = (index) => {
    if (winner === null) {
      setBet(index);
    }
  };

  return (
    <div className="App">
      <h1>Horse Race</h1>
      <div className="track">
        {positions.map((position, index) => (
          <div
            key={index}
            className="horse"
            style={{
              left: position,
              top: `${index * 25}px`,
            }}
            onClick={() => handleBet(index)}
          >
            {/* 🐎 */}
            <img src={horse} alt="I am A" width={"30px"} />
          </div>
        ))}
      </div>
      {_.isNumber(bet) && (
        <button onClick={startRace} disabled={winner !== null}>
          Start Race
        </button>
      )}
      {!_.isNumber(bet) && <h2>請點選馬匹下注哪批馬兒跑最快</h2>}
      {_.isNumber(bet) && <div>你賭注{bet + 1}號小馬跑最快</div>}
    </div>
  );
}

export default App;
