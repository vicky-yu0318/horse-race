import React, { useState, useEffect, useMemo } from "react";
import "./App.css";

const horses = [
  "horse1",
  "horse2",
  "horse3",
  "horse4",
  "horse5",
  "horse6",
  "horse7",
];

function App() {
  const [bet, setBet] = useState(null);
  const [winner, setWinner] = useState(null);
  const [positions, setPositions] = useState(Array(horses.length).fill(0));
  const raceDurations = useMemo(
    () => horses.map(() => Math.random() * 5000 + 1000),
    []
  );

  const startRace = () => {
    const newPositions = Array(horses.length).fill(0);

    horses.forEach((_, index) => {
      setTimeout(() => {
        newPositions[index] = 100;

        setPositions([...newPositions]);
      }, raceDurations[index]);
    });
  };

  useEffect(() => {
    if (positions.every((pos) => pos === 100)) {
      const winningHorse =
        horses[raceDurations.indexOf(Math.min(...raceDurations))];
      setWinner(winningHorse);

      if (bet && winner) {
        setTimeout(() => {
          alert(
            bet === winner
              ? `You won! ${winner} is the fastest!`
              : `You lost! ${winner} is the fastest!`
          );
        }, 5000); //需要想想有沒有更好的方式，待馬跑完再出現 alert
      }
    }
  }, [bet, positions, raceDurations, winner]);

  return (
    <div className="App">
      <h1>Horse Race</h1>
      <div className="race-track">
        {horses.map((horse, index) => (
          <div
            key={horse}
            className="horse"
            style={{
              bottom: index * 25,
              left: `${positions[index]}%`,
              transition: `left ${index - 0.5}s  ease-in-out`,
            }}
            onClick={() => setBet(horse)}
          >
            🐎
          </div>
        ))}
      </div>
      {bet && <button onClick={startRace}>Start Race</button>}
      {bet && <h2>Your bet: {bet}</h2>}
      {!bet && <h2>choose your bet horse</h2>}
    </div>
  );
}

export default App;
