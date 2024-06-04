import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import _ from "lodash";

const horseCount = 7;
const baseSpeed = 200; // ms per frame
const trackLength = 100; // number of frames to complete the race

function App() {
  const [positions, setPositions] = useState(Array(horseCount).fill(2));
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
    intervalRefs.current = positions.map((_, index) => {
      const speedMultiplier = 0.5 + Math.random();
      return setInterval(() => {
        setPositions((prevPositions) => {
          const newPositions = [...prevPositions];
          newPositions[index] += 1;
          if (newPositions[index] >= trackLength) {
            clearInterval(intervalRefs.current[index]);
            if (newPositions.every((pos) => pos >= trackLength)) {
              console.log("newPositions :>> ", newPositions);
              // setWinner(newPositions.indexOf(Math.max(...newPositions)));
            }
            if (!winner && !isFirst) {
              console.log("index :>> ", index);
              isFirst = true;
              setWinner(index);
            }
          }
          return newPositions;
        });
      }, baseSpeed / speedMultiplier);
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
              left: `calc(${(position / trackLength) * 100}% - 40px)`,
              top: `${index * 25}px`,
            }}
            onClick={() => handleBet(index)}
          >
            🐎
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
