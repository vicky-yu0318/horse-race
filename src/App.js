import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import _ from "lodash";
import horse from "./images/horse.png";

const horseCount = 7;
const baseSpeed = 200; // ms per frame
const trackLength = window.innerWidth - 40;

function App() {
  const [positions, setPositions] = useState(Array(horseCount).fill(0));
  const [bet, setBet] = useState(null);
  const [winner, setWinner] = useState(null);
  const intervalRef = useRef(null);
  const [raceFinished, setRaceFinished] = useState(false);

  // useEffect(() => {
  //   console.log("positions :>> ", positions);
  //   if (positions.every((pos) => pos >= trackLength) && winner) {
  //     if (bet === winner) {
  //       alert(`你猜對了，是 ${winner + 1} 號馬兒跑最快`);
  //     } else {
  //       alert(`你賭注輸了，是 ${winner + 1} 號馬兒跑最快`);
  //     }
  //   }
  // }, [bet, positions, winner]);

  useEffect(() => {
    // clearInterval(intervalRef.current);
    if (raceFinished) {
      if (bet === winner) {
        alert(`你猜對了，是 ${winner + 1} 號馬兒跑最快`);
      } else {
        alert(`你賭注輸了，是 ${winner + 1} 號馬兒跑最快`);
      }
      setRaceFinished(false); // Reset the race finished flag
    }
  }, [raceFinished, bet, winner]);

  const startRace = () => {
    clearInterval(intervalRef.current);
    let isFirst = false;

    intervalRef.current = setInterval(() => {
      setPositions((prevPositions) => {
        const newPositions = prevPositions.map((pos, index) => {
          const runDistance = ((trackLength * 1) / 100) * (0.5 + Math.random());
          const newPosition =
            pos + runDistance > trackLength ? trackLength : pos + runDistance;

          if (newPosition >= trackLength && !_.isNumber(winner) && !isFirst) {
            isFirst = true;
            setWinner(index);
            clearInterval(intervalRef.current);
            setRaceFinished(true);
          }

          return newPosition;
        });

        return newPositions;
      });
    }, baseSpeed);
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
            <img src={horse} alt="horse" width={"30px"} />
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
