import React, { useState, useEffect, useRef, useMemo } from "react";
import { Peer } from "peerjs";
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
  TextField,
} from "@mui/material";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import { tableCellClasses } from "@mui/material/TableCell";
import ClipboardComponent from "./component/ClipboardComponent";

const horseCount = 7;
const trackLength = window.innerWidth - 40;

function App() {
  const [positions, setPositions] = useState(Array(horseCount).fill(0));
  const [bet, setBet] = useState(null);
  const [winner, setWinner] = useState(null);
  const [raceResults, setRaceResults] = useState([]);
  const [players, setPlayers] = useState([]);
  const [peerName, setPeerName] = useState();

  const [inputPeerId, setInputPeerId] = useState("");
  const [inputMyName, setInputMyName] = useState("");

  const [connections, setConnections] = useState([]);
  const intervalRef = useRef(null);
  const [baseSpeed, setBaseSpeed] = useState(200);
  const [myid, setMyid] = useState();
  const [linkid, setLinkid] = useState();
  const [broadcastData, setBroadcastData] = useState();

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
  const peer = new Peer();
  // const aaRef = useRef();
  const [conn, setConn] = useState();
  const stringConn = useMemo(() => JSON.stringify(connections), [connections]);

  useEffect(() => {
    peer.on("open", () => {
      // console.log("自己的id:>> ", peer.id);
      setMyid(peer.id);
    });
    peer.on("connection", (conn) => {
      console.log("開始連線");
      console.log("連進來的 id :>> ", conn.peer);
      setLinkid(conn.peer);
      setConn(conn);
      // aaRef.current = conn;
      // 處理來自其他 Peer // 當有其他 Peer 連接到這個 Peer 時，觸發這個回調函數，並傳遞連接對象 conn。
    });
  }, []);

  const handleConnect = () => {
    const conn = peer.connect(inputPeerId); // 連接到另一個 Peer
    setConn(conn);
    setConnections((preConnections) => [
      ...preConnections,
      {
        peerId: inputPeerId,
        player: inputMyName,
        betHorse: bet + 1,
      },
    ]);
    // console.log("inputPeerId :>> ", inputPeerId);
    // console.log("inputMyName :>> ", inputMyName);
    // console.log("bet :>> ", bet);
  };

  const handleCC = () => {
    // aaRef.current.send("房主丟東西囉");
    conn.send("房主丟東西囉!!!");
  };

  useEffect(() => {
    if (!conn) return;
    conn.on("open", () => {
      // console.log("connections :>> ", connections);
      conn.send(stringConn); // 在連接打開時發送消息 (當連接建立 (open) 時，觸發這個回調函數)
    });

    conn.on("data", (data) => {
      // 當接收到數據時
      // Will print 'hi!'
      console.log("接收數據:", data);
      handleIncomingData(data);
    });
  }, [conn, stringConn]);

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

  // useEffect(() => {
  //   const newPeer = new Peer(undefined, {
  //     // 創建一個 Peer 實例
  //     host: "localhost",
  //     port: 9000,
  //     path: "/peerjs/myapp",
  //   });

  //   newPeer.on("open", (id) => {
  //     // 當 Peer 連接成功時觸發
  //     setPeer(newPeer);
  //     setPeerId(id);
  //     // console.log("My peer ID is: " + id);
  //     // console.log("peer :>> ", peer);
  //   });

  //   newPeer.on("connection", (conn) => {
  //     // 當有新的連接建立時觸發
  //     conn.on("data", (data) => {
  //       console.log("data :>> ", data);
  //       handleIncomingData(data);
  //     });

  //     setConnections((prevConns) => [...prevConns, conn]);
  //   });

  //   return () => {
  //     if (newPeer) {
  //       newPeer.destroy();
  //     }
  //   };
  // }, []);

  // const connectToPeer = (peerId) => {
  //   const conn = peer.connect(peerId); // 通過 Peer ID 連接到其他 Peer
  //   setConnections((prevConnections) => [...prevConnections, conn]);
  // };

  const handleIncomingData = (data) => {
    const tempAry = JSON.parse(data);
    setBroadcastData(tempAry);

    // switch (data.type) {
    //   case "updatePositions":
    //     setPositions(data.positions);
    //     break;
    //   case "updatePlayers":
    //     setPlayers(data.players);
    //     break;
    //   case "raceResults":
    //     setRaceResults(data.results);
    //     break;
    //   case "winner":
    //     setWinner(data.winner);
    //     break;
    //   default:
    //     break;
    // }
  };

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
    // broadcastData({ type: "restartRace" });
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
            // broadcastData({ type: "winner", winner: index });
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
            //   broadcastData({ type: "raceResults", results: raceResults });
          }
          return newPosition;
        });
        // broadcastData({ type: "updatePositions", positions: newPositions });
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

  useEffect(() => {
    setBaseSpeed(baseSpeedValue);
  }, [baseSpeedValue]);

  // const broadcastData = (data) => {
  //   connections.forEach((conn) => {
  //     conn.send(data);
  //   });
  // };

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <ClipboardComponent myid={myid} />
        <TextField
          label={"想要連線的房主 id"}
          value={inputPeerId}
          onChange={(e) => setInputPeerId(e.target.value.trim())}
          variant="outlined"
          style={{ marginBottom: "10px", width: "100%" }}
        />
        <TextField
          label={"我的名字"}
          value={inputMyName}
          onChange={(e) => setInputMyName(e.target.value.trim())}
          variant="outlined"
          style={{ marginBottom: "10px", width: "100%" }}
        />

        {!linkid && (
          <button onClick={handleConnect}>選好賭注的賽馬後連線</button>
        )}
        {linkid && <button onClick={handleCC}>房主丟東西給別人</button>}

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ textAlign: "center" }}>Horse Race</h1>
          {/* <button
            onClick={() => connectToPeer(prompt("請輸入要連接的 Peer ID:"))}
          >
            連接到其他 Peer
          </button>
          <ul>
            {connections.map((conn, index) => (
              <li key={index}>{conn.peer}</li>
            ))}
          </ul> */}
          {/* onSubmit={handleNicknameSubmit} */}
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

        {broadcastData?.length > 0 && (
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table aria-label="broadcast table">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Item</StyledTableCell>
                  <StyledTableCell align="center">playerId</StyledTableCell>
                  <StyledTableCell align="right">playerName</StyledTableCell>
                  <StyledTableCell align="right">betHorse</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {broadcastData.map((broadcast, index) => (
                  <StyledTableRow key={index}>
                    <TableCell component="th" scope="row">
                      {index + 1}
                    </TableCell>
                    <TableCell align="center">{broadcast.peerId}</TableCell>
                    <TableCell align="right">{broadcast.player}</TableCell>
                    <TableCell align="right">{broadcast.betHorse}</TableCell>
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
