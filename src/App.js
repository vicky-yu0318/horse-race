import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import _ from "lodash";
import horse from "./images/horse.png";
import { useForm } from "react-hook-form";
import {
  Paper,
  TableContainer,
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@mui/material";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import { tableCellClasses } from "@mui/material/TableCell";

const horseCount = 7;
const trackLength = window.innerWidth - 40;

function App() {
  const [positions, setPositions] = useState(Array(horseCount).fill(0));
  const [bet, setBet] = useState(null);
  const [winner, setWinner] = useState(null);
  const [raceResults, setRaceResults] = useState([]);
  const intervalRef = useRef(null);
  const [baseSpeed, setBaseSpeed] = useState(200);
  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
  });
  const baseSpeedValue = watch("baseSpeed", baseSpeed);

  const theme = createTheme({
    palette: {
      primary: {
        main: "#ccc",
      },
      secondary: {
        main: "#edf2ff",
      },
    },
  });

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor: theme.palette.common.black,
      color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 14,
    },
  }));

  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.primary.main,
    },
    // hide last border
    "&:last-child td, &:last-child th": {
      border: 0,
    },
  }));

  useEffect(() => {
    if (positions.every((pos) => pos >= trackLength)) {
      clearInterval(intervalRef.current);
      if (bet === winner) {
        alert(`你猜對了，是 ${winner + 1} 號馬兒跑最快`);
      } else {
        alert(`你賭注輸了，是 ${winner + 1} 號馬兒跑最快`);
      }
    }
  }, [bet, winner, positions, baseSpeed, raceResults]);

  const restartRace = () => {
    setWinner(null);
    setBet(null);
    setPositions(Array(horseCount).fill(0));
    setRaceResults([]);
  };

  const startRace = () => {
    clearInterval(intervalRef.current);
    let isFirst = false;
    let times = [];

    const startTime = Date.now();
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
          const finishAry = _.map(times, (time) => time.i);

          if (newPosition >= trackLength && finishAry.indexOf(index) === -1) {
            const newTime = Date.now();
            const secondsDifference = (newTime - startTime) / 1000; //將毫秒轉為秒

            const tempObj = {
              i: index,
              horse: index + 1,
              time: secondsDifference,
            };

            times.push(tempObj);
            setRaceResults(() => _.sortBy(times, ["time"]));
          }
          return newPosition;
        });
        return newPositions;
      });
    }, baseSpeed);
  };

  const handleBet = (index) => {
    if (errors.baseSpeed) {
      alert("please enter the correct base speed");
      return;
    }
    if (winner === null) {
      setBet(index);
    }
  };
  // const onSubmit = (data) => {
  //   setBaseSpeed(parseInt(data.baseSpeed));
  // };
  // const handleChange = (e) => {
  //   trigger("baseSpeed");
  // };

  useEffect(() => {
    setBaseSpeed(baseSpeedValue);
  }, [baseSpeedValue]);

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ textAlign: "center" }}>Horse Race</h1>
          <form
            // onSubmit={handleSubmit(onSubmit)}
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div>
              <label>Base Speed:</label>
              <div>
                <input
                  // onChange={handleChange}
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
                {/* <input
                  type="submit"
                  disabled={!isValid}
                  style={{ marginLeft: 5 }}
                /> */}
              </div>
              {errors.baseSpeed && (
                <div>
                  {
                    <span style={{ color: "red" }}>
                      {errors.baseSpeed.message}
                    </span>
                  }
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
                <img
                  src={horse}
                  alt="horse"
                  width={"30px"}
                  style={{ opacity: errors.baseSpeed ? 0.5 : 1 }}
                />
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            {_.isNumber(bet) && (
              <button
                onClick={startRace}
                disabled={winner !== null}
                style={{ marginRight: 10 }}
              >
                Start Race
              </button>
            )}
            {_.isNumber(bet) && _.isNumber(winner) && (
              <button onClick={restartRace}>Restart Race</button>
            )}
            {!_.isNumber(bet) && !errors.baseSpeed && (
              <h3>請點選馬匹下注哪批馬兒跑最快</h3>
            )}
            {_.isNumber(bet) && <div>你賭注 {bet + 1} 號小馬跑最快</div>}
          </div>
        </div>
        {raceResults.length === horseCount && (
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table aria-label="rank table">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Rank</StyledTableCell>
                  <StyledTableCell align="center">Horse</StyledTableCell>
                  <StyledTableCell align="right">Time (s)</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {raceResults.map((result, index) => (
                  <StyledTableRow key={result.i}>
                    <TableCell component="th" scope="row">
                      {index + 1}
                    </TableCell>
                    <TableCell align="center">{result.horse}</TableCell>
                    <TableCell align="right">{result.time}</TableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
