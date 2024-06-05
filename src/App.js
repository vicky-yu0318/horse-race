import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import _ from "lodash";
import horse from "./images/horse.png";
import { useForm } from "react-hook-form";

const horseCount = 7;
// const baseSpeed = 200; // ms per frame
const trackLength = window.innerWidth - 40;

function App() {
  const [positions, setPositions] = useState(Array(horseCount).fill(0));
  const [bet, setBet] = useState(null);
  const [winner, setWinner] = useState(null);
  const intervalRef = useRef(null);
  const [baseSpeed, setBaseSpeed] = useState(200);
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
  });

  useEffect(() => {
    if (positions.every((pos) => pos >= trackLength)) {
      if (bet === winner) {
        alert(`你猜對了，是 ${winner + 1} 號馬兒跑最快`);
      } else {
        alert(`你賭注輸了，是 ${winner + 1} 號馬兒跑最快`);
      }
      clearInterval(intervalRef.current);
    }
  }, [bet, winner, positions]);

  const restartRace = () => {
    setWinner(null);
    setBet(null);
    setPositions(Array(horseCount).fill(0));
  };

  const startRace = () => {
    clearInterval(intervalRef.current);
    let isFirst = false;

    intervalRef.current = setInterval(() => {
      setPositions((prevPositions) => {
        const newPositions = prevPositions.map((pos, index) => {
          const runDistance = ((trackLength * 1) / 100) * (0.5 + Math.random());
          const newPosition =
            pos + runDistance > trackLength ? trackLength : pos + runDistance;

          if (newPosition >= trackLength && !isFirst) {
            isFirst = true;
            setWinner(index);
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

  const onSubmit = (data) => {
    setBaseSpeed(data.baseSpeed);
  };
  const handleChange = async (e) => {
    await trigger("baseSpeed");
  };

  return (
    <div className="App">
      <h1 style={{ textAlign: "center" }}>Horse Race</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div>
          <label>Base Speed:</label>

          <div>
            <input
              onChange={handleChange}
              type="text"
              defaultValue={baseSpeed}
              {...register("baseSpeed", {
                required: "必填欄位",
                pattern: {
                  value: /^\d+$/,
                  message: "只能輸入數字",
                },
              })}
            />
            <input
              type="submit"
              disabled={!isValid}
              style={{ marginLeft: 5 }}
            />
          </div>
          {errors.baseSpeed && (
            <div>
              {<span style={{ color: "red" }}>{errors.baseSpeed.message}</span>}
            </div>
          )}
          {!errors.baseSpeed && <div style={{ padding: "11px 0" }}></div>}
        </div>
      </form>
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
      <div style={{ textAlign: "center" }}>
        {_.isNumber(bet) && (
          <button onClick={startRace} disabled={winner !== null}>
            Start Race
          </button>
        )}
        {_.isNumber(bet) && _.isNumber(winner) && (
          <button onClick={restartRace}>Restart Race</button>
        )}
        {!_.isNumber(bet) && <h3>請點選馬匹下注哪批馬兒跑最快</h3>}
        {_.isNumber(bet) && <div>你賭注{bet + 1}號小馬跑最快</div>}
      </div>
    </div>
  );
}

export default App;
