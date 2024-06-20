import "./App.css";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Peer } from "peerjs";
import _ from "lodash";
import { useForm } from "react-hook-form";
import {
  Box,
  Stack,
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
import horseImage from "./images/horse.png";
import MosqueIcon from "@mui/icons-material/Mosque";
import ClipboardComponent from "./component/ClipboardComponent";

const horseCount = 7;
const trackLength = window.innerWidth - 40;

function App() {
  const [positions, setPositions] = useState(Array(horseCount).fill(0));
  const [bet, setBet] = useState(null);
  const [winner, setWinner] = useState(null);
  const [raceResults, setRaceResults] = useState([]);
  const [players, setPlayers] = useState([]);
  const [baseSpeed, setBaseSpeed] = useState(200);
  const intervalRef = useRef(null);

  const [inputMainId, setInputMainId] = useState("");
  const [inputMyName, setInputMyName] = useState("");
  const [myid, setMyid] = useState();
  const [isConnected, setIsConnected] = useState();
  const [broadcastData, setBroadcastData] = useState({});

  // const connRef = useRef({});
  const [conns, setConns] = useState({});
  const peerRef = useRef(null);

  const {
    register,
    watch,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
  });
  const baseSpeedValue = watch("baseSpeed", baseSpeed);

  useEffect(() => {
    setBaseSpeed(baseSpeedValue);
  }, [baseSpeedValue]);
  // =====================================================

  useEffect(() => {
    peerRef.current = new Peer();
    // TODO: 進頁時先抓自己的 id
    peerRef.current.on("open", (id) => {
      // console.log("自己的id:>> ", peerRef.current.id);
      // console.log("id :>> ", id);
      setMyid(id);
    });

    // TODO: 其他人連線進來時，房主 conns 觸發
    peerRef.current.on("connection", (conn) => {
      // console.log("連進來的 id :>> ", conn.peer);
      setIsConnected(conn.peer);
      // conns[conn.peer] = conn;
      setConns((prevConns) => ({ ...prevConns, [conn.peer]: conn })); // 多人連入
    });

    // 清理函数
    return () => {
      peerRef.current.destroy();
    };
  }, []);

  // TODO: 其他人手動連線
  const handleConnect = () => {
    const conn = peerRef.current.connect(inputMainId); // 連接到屋主 Peer
    // console.log("其他人連接成功: "); // conn.peer 為屋主 id
    setConns({ main: conn });
    // connRef.current["main"] = conn;
  };

  // TODO: (4) 其他玩家整理接收的資料
  const handleIncomingData = useCallback(
    (data) => {
      const newData = JSON.parse(data);
      switch (newData.type) {
        case "position":
          setPositions(newData.positions);
          break;
        case "raceResults":
          setRaceResults(newData.rankTime);
          break;
        case "winner":
          setWinner(newData.winner);
          break;
        case "restartRace":
          setWinner(null);
          setBet(null);
          setPositions(Array(horseCount).fill(0));
          setRaceResults([]);
          break;
        case "player":
          if (!players) {
            setPlayers(newData);
          } else {
            let combined;
            if (Array.isArray(players)) {
              // console.log("players 是陣列");
              combined = _.concat(newData.players, players);
            } else {
              // console.log("players 是物件");
              // 先合併兩個陣列
              combined = _.concat(newData.players, players.players);
            }
            // 基於 id 去重複，並保留 timestamp 較新的物件
            let merged = _.unionBy(combined, "id");
            setPlayers(merged);
          }
          break;
        default:
          break;
      }
    },
    [players]
  );

  // TODO: (3) conns 被觸發，接收 (2) send 的資料 （此 data, 雙方都會出現）
  useEffect(() => {
    if (_.isEmpty(conns)) return; // conns 為所有其他連入玩家conn(物件)不含房主

    _.forEach(conns, (conn) => {
      conn.on("data", (data) => {
        // conn.peer 為所有連入其他人 id
        // console.log("接收 (2) send 的資料:", data);
        handleIncomingData(data);
      });
    });
  }, [conns, handleIncomingData]);

  // TODO: (2) 房主廣播 -> 觸發 (3) conns
  const prevPlayersRef = useRef(players);
  useEffect(() => {
    if (!_.isEqual(prevPlayersRef.current, players)) {
      let tempObj;
      if (Array.isArray(players)) {
        tempObj = { type: "player", players: players };
      }
      _.forEach(conns, (conn) =>
        conn.send(JSON.stringify(tempObj ? tempObj : players))
      );
      prevPlayersRef.current = players;
    }
  }, [conns, players]);

  // TODO: (1) 其他人手動傳送資料到房主 -> 觸發 (3) conns
  const handlePlayerData = useCallback(() => {
    if (!inputMainId) {
      alert("請輸入欲連線房住的 id");
      return;
    }
    if (!inputMyName) {
      alert("請輸入您的姓名");
      return;
    }

    let newBroadcastData = {
      type: "player",
      players: [
        {
          role: "general player",
          id: myid,
          player: inputMyName,
          betHorse: _.isNumber(bet) ? bet + 1 : null,
        },
      ],
    };
    const strNewBroadcastData = JSON.stringify(newBroadcastData);

    // 連線存在並且已經開啟：在發送資料之前檢查連線是否存在並且已經開啟
    // if (connRef.current["main"] && connRef.current["main"].open) {
    if (conns["main"] && conns["main"].open) {
      // connRef.current["main"].send(strNewBroadcastData);
      conns["main"].send(strNewBroadcastData); // 其他人傳物件
    }
  }, [bet, conns, inputMainId, inputMyName, myid]);

  // TODO: (1) 房主傳遞自己資料 -> 觸發 (2) players
  const handleMainData = useCallback(() => {
    const newBroadcastData = {
      role: "host player",
      id: myid,
      player: inputMyName,
      betHorse: _.isNumber(bet) ? bet + 1 : null,
    };

    const isPlayerExist = _.some(
      players,
      (player) => player.id === newBroadcastData.id
    );
    if (isPlayerExist) {
      const newData = _.map(players, (player) =>
        player.id === newBroadcastData.id ? newBroadcastData : player
      );
      setPlayers(newData);
    } else {
      setPlayers((prevPlayers) => [...prevPlayers, newBroadcastData]);
    }
  }, [bet, inputMyName, myid, players]);

  //  ================================
  // TODO: (1-1) 房主廣播 馬匹所在位置，或賭注勝負資訊
  const handleMainUpdateData = (updateData) => {
    setBroadcastData((prevData) => {
      const newData = { ...prevData, ...updateData };
      _.forEach(conns, (conn) => conn.send(JSON.stringify(newData)));
      return newData;
    });
  };

  // TODO: 任何人(房主 or 其他玩家) 選擇賭注馬匹觸發 1-1 -> 3 -> 4
  const previousBetRef = useRef();
  useEffect(() => {
    if (_.isNumber(bet) && previousBetRef.current !== bet) {
      if (isConnected) {
        handleMainData();
      } else {
        handlePlayerData();
      }
      previousBetRef.current = bet;
    }
  }, [bet, handleMainData, handlePlayerData, isConnected]);

  // =====================================================
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
    handleMainUpdateData({
      type: "restartRace",
    });
  };

  const funcIsBetNull = () => {
    return _.chain(players)
      .map((player) => player.betHorse)
      .some((isBetHorse) => isBetHorse === null)
      .value();
  };

  const startRace = () => {
    if (funcIsBetNull() || !players) {
      alert("請所有玩家點選賭注的馬匹");
      return;
    }

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
            handleMainUpdateData({ type: "winner", winner: index });
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
            const rankTime = _.sortBy(times, ["time"]);
            handleMainUpdateData({
              type: "raceResults",
              rankTime: rankTime,
            });
            setRaceResults(rankTime);
          }
          return newPosition;
        });
        handleMainUpdateData({
          type: "position",
          positions: newPositions,
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

  // =====================================================
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

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <ClipboardComponent myid={myid} />
        {!isConnected && (
          <TextField
            label={"想要連線的房主 id"}
            value={inputMainId}
            onChange={(e) => setInputMainId(e.target.value.trim())}
            variant="outlined"
            style={{ marginBottom: "10px", width: "100%" }}
          />
        )}
        {/* <button onClick={() => prompt("請輸入要連接的 Peer ID:")}>
          連接到其他 Peer
        </button> */}
        <TextField
          label={"我的名字"}
          value={inputMyName}
          onChange={(e) => setInputMyName(e.target.value.trim())}
          variant="outlined"
          style={{ marginBottom: "10px", width: "100%" }}
        />
        {!isConnected && _.isEmpty(conns) && (
          <button onClick={handleConnect}>連線</button>
        )}
        {!isConnected && (
          <button onClick={handlePlayerData}>其他玩家填好資料傳送</button>
        )}
        {isConnected && (
          <button onClick={handleMainData}>房主填好資料傳送</button>
        )}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ textAlign: "center" }}>Horse Race</h1>
          <form
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div>
              <label>Base Speed:</label>
              <div>
                <input
                  disabled={!isConnected}
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
                  src={horseImage}
                  alt="horse"
                  width={"30px"}
                  style={{ opacity: errors.baseSpeed ? 0.5 : 1 }}
                />
              </div>
            ))}
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: 10,
            }}
          >
            {_.isNumber(bet) && isConnected && (
              <button
                onClick={startRace}
                disabled={winner !== null}
                style={{ marginRight: 1 }}
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
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        gap={0.5}
                        sx={{
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Box>
                          {result.horse === winner + 1 && <MosqueIcon />}
                        </Box>
                        <Box>{result.horse}</Box>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{result.time}</TableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {players?.length > 0 && (
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table aria-label="broadcast table">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Item</StyledTableCell>
                  <StyledTableCell align="center">player role</StyledTableCell>
                  <StyledTableCell align="center">playerId</StyledTableCell>
                  <StyledTableCell align="right">playerName</StyledTableCell>
                  <StyledTableCell align="right">betHorse</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {players.map((player, index) => (
                  <StyledTableRow key={index}>
                    <TableCell component="th" scope="row">
                      {index + 1}
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        gap={0.5}
                        sx={{ alignItems: "center" }}
                      >
                        <Box>
                          {player.role === "host player" && <MosqueIcon />}
                        </Box>
                        <Box>{player.role}</Box>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">{player.id}</TableCell>
                    <TableCell align="right">{player.player}</TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        gap={0.5}
                        sx={{
                          alignItems: "center",
                          justifyContent: "flex-end",
                        }}
                      >
                        <Box>
                          {_.isNumber(winner) &&
                            player.betHorse === winner + 1 && <MosqueIcon />}
                        </Box>
                        <Box>{player.betHorse}</Box>
                      </Stack>
                    </TableCell>
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
