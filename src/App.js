import React, { useState, useEffect } from "react";
import "./App.css";

// const horses = Array.from({ length: 7 }, (_, i) => ({
//   id: i + 1,
//   position: 0,
//   speed: 20,
// }));

function App() {
  const [bets, setBets] = useState(null);
  const [winner, setWinner] = useState(null);
  const [horses, setHorses] = useState(
    Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      position: 0,
      speed: 20,
    }))
  );

  useEffect(() => {
    if (winner) {
      alert(
        bets === winner
          ? `你贏了！馬${winner}是最快的！`
          : `你輸了。馬${winner}是最快的。`
      );
    }
  }, [bets, winner]);

  const handleBet = (id) => {
    if (!bets) setBets(id);
  };

  const startRace = () => {
    const raceInterval = setInterval(() => {
      let raceFinished = false;
      const updatedHorses = horses.map((horse) => {
        const newPosition = horse.position + horse.speed * (1 + Math.random());
        console.log("newPosition :>> ", newPosition);
        if (!raceFinished) {
          const firstHourse = horses.find((hor) => hor.position >= 100);
          setWinner(firstHourse?.id);
          raceFinished = true;
        }

        return { ...horse, position: newPosition };
      });

      setHorses(horses.splice(0, horses.length, ...updatedHorses));

      if (horses.every((hor) => hor.position >= 150)) {
        console.log("winner :>> ", winner);

        clearInterval(raceInterval);
      }
    }, 1000);
  };

  return (
    <div className="App">
      <h1>馬賽跑 winner{winner}</h1>
      <div className="track" style={{ padding: "100px 0", overflow: "hidden" }}>
        {horses.map((horse, index) => (
          <div
            key={horse.id}
            className="horse"
            style={{
              top: `${index * 35}px`,
              left: `${horse.position}%`,
            }}
            onClick={() => handleBet(horse.id)}
          >
            🐎 {horse.id}
          </div>
        ))}
      </div>
      {!bets && <div>先點選押注的馬匹</div>}
      {bets && (
        <button onClick={startRace} disabled={!!winner}>
          開始賽跑
        </button>
      )}
      {bets && !winner && <p>你押注的是馬{bets}</p>}
    </div>
  );
}

export default App;
