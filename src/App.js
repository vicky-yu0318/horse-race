import React, { useState, useEffect, useRef, useCallback } from "react";
import { Peer } from "peerjs";
import "./App.css";
import _ from "lodash";
import horse from "./images/horse.png";
import MosqueIcon from "@mui/icons-material/Mosque";
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
import ClipboardComponent from "./component/ClipboardComponent";

const horseCount = 7;
const trackLength = window.innerWidth - 40;

function App() {
  const [positions, setPositions] = useState(Array(horseCount).fill(0));
  const [bet, setBet] = useState(null);
  const [winner, setWinner] = useState(null);
  const [raceResults, setRaceResults] = useState([]);
  const [players, setPlayers] = useState();
  const intervalRef = useRef(null);
  const [baseSpeed, setBaseSpeed] = useState(200);

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
    handleSubmit,
    trigger,
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

    // TODO: 其他人連線進來時觸發
    peerRef.current.on("connection", (conn) => {
      // console.log("連進來的 id :>> ", conn.peer);
      setIsConnected(conn.peer);
      // conns[conn.peer] = conn;
      setConns((preConns) => ({ ...preConns, [conn.peer]: conn })); // 多人連入
    });

    // 清理函数，组件卸载时销毁 Peer 实例
    return () => {
      peerRef.current.destroy();
    };
  }, []);

  // TODO: 其他人手動連線
  const handleConnect = () => {
    const conn = peerRef.current.connect(inputMainId); // 連接到屋主 Peer
    console.log("其他人連接成功: "); // conn.peer 為屋主 id
    setConns({ main: conn });
    // connRef.current["main"] = conn;
  };

  // TODO: (4) 其他玩家整理接收的資料
  const handleIncomingData = useCallback(
    (data) => {
      const newData = JSON.parse(data);
      // console.log("newData :>> ", newData);

      switch (newData.type) {
        case "position":
          setPositions(newData.positions);
          break;
        case "raceResults":
          setRaceResults(newData.rankTime);
          break;
        case "restartRace":
          setWinner(null);
          setBet(null);
          setPositions(Array(horseCount).fill(0));
          setRaceResults([]);
          break;

        case "player":
          // console.log("newData物件");
          if (!players) {
            // 首次 undefined
            setPlayers(newData);
          } else {
            let combined;
            if (Array.isArray(players)) {
              // console.log("player 是陣列");
              combined = _.concat(newData.players, players);
            } else {
              // console.log("player 是物件");
              // 先合併兩個陣列
              combined = _.concat(newData.players, players.players);
            }
            // 使用 _.unionBy 來基於 id 去重，並保留 timestamp 較新的物件
            let merged = _.unionBy(combined, "id");
            setPlayers(merged);
          }

          break;

        // if (Array.isArray(newData.players)) {
        //   console.log("跑陣列", newData.players);
        //   console.log("players :>> ", players);
        //   if (!players.length) {
        //     console.log("players 非陣列");
        //     const updatedPlayers = [...newData.players];
        //     console.log("updatedPlayers :>> ", updatedPlayers);
        //     setPlayers(updatedPlayers);
        //   } else {
        //     console.log("players 是陣列");
        //     const mergedArray = players.map((obj1) => {
        //       const newObj = newData.players.find(
        //         (obj2) => obj2.id === obj1.id
        //       );
        //       return newObj ? newObj : obj1;
        //     });
        //     console.log("mergedArray :>> ", mergedArray);
        //     setPlayers(mergedArray);
        //   }
        // } else {
        //   console.log("跑物件", newData.players);
        //   let updatedPlayers;
        //   const isPlayerExist = _.some(
        //     players,
        //     (player) => player.id === newData.players.id
        //   );
        //   if (isPlayerExist) {
        //     const newData2 = _.map(players, (player) =>
        //       player.id === newData.players.id ? newData.players : player
        //     );
        //     updatedPlayers = [...newData2];
        //   } else {
        //     updatedPlayers = [...players, newData];
        //   }
        //   setPlayers(updatedPlayers);
        // }

        default:
          break;
      }
    },
    [players]
  );

  // TODO: (3) 接收 (2) send 的資料 （此 data, 雙方都會出現）
  useEffect(() => {
    if (!conns) return; // conns 有所有連入的人 conn(物件)

    _.forEach(conns, (conn) => {
      conn.on("data", (data) => {
        // conn.peer 為所有連入的人 id
        // console.log("接收 2 send 的資料:", data);
        handleIncomingData(data);
      });
    });
  }, [conns, handleIncomingData]);

  // TODO: (2) 觸發 players, 房主實際廣播
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

  // TODO: (1) 其他人手動傳送資料到屋主
  const handlePlayerData = useCallback(() => {
    if (!inputMainId) {
      alert("請輸入欲連線 id");
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
          role: "general",
          id: myid,
          player: inputMyName,
          betHorse: _.isNumber(bet) ? bet + 1 : null,
        },
      ],
    };

    const strNewBroadcastData = JSON.stringify(newBroadcastData);

    // 连接存在并且已经打开：在发送数据前检查连接是否存在并且已经打开
    // if (connRef.current["main"] && connRef.current["main"].open) {
    if (conns["main"] && conns["main"].open) {
      // connRef.current["main"].send(data);
      conns["main"].send(strNewBroadcastData); // 其他人傳物件
    }
  }, [bet, conns, inputMainId, inputMyName, myid]);

  // TODO: (1) 屋主傳遞自己資料 -> 觸發 players
  const handleMainData = useCallback(() => {
    const newBroadcastData = {
      role: "main",
      id: myid,
      player: inputMyName,
      betHorse: _.isNumber(bet) ? bet + 1 : null,
    };

    const isPlayerExist = _.some(
      players,
      (player) => player.id === newBroadcastData.id
    );
    if (isPlayerExist) {
      const newData2 = _.map(players, (player) =>
        player.id === newBroadcastData.id ? newBroadcastData : player
      );
      setPlayers(newData2);
    } else {
      setPlayers((prePlayers) => [...prePlayers, newBroadcastData]);
    }
  }, [bet, inputMyName, myid, players]);

  //  ================================

  // TODO: (2-1) 觸發 broadcastData, 房主實際廣播
  // const broadcastDataRef = useRef(broadcastData);
  // useEffect(() => {
  //   console.log("broadcastData :>> ", broadcastData);
  // if (!_.isEqual(broadcastDataRef.current, broadcastData)) {
  //   _.forEach(conns, (conn) => conn.send(JSON.stringify(broadcastData))); // 屋主傳陣列
  // broadcastDataRef.current = broadcastData;
  // }
  // }, [broadcastData, conns]);

  // TODO: (1-1) 屋主傳馬匹所在位置，賭注勝負資訊
  // const handleMainUpdateData = useCallback((updateData) => {
  //   console.log("updateData :>> ", updateData);
  //   setBroadcastData(updateData);
  // }, []);

  const handleMainUpdateData = (updateData) => {
    setBroadcastData((prevData) => {
      const newData = { ...prevData, ...updateData };
      // 立即處理新的數據
      _.forEach(conns, (conn) => conn.send(JSON.stringify(newData)));
      return newData;
    });
  };

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
    if (funcIsBetNull()) {
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

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        {/* players:{JSON.stringify(players)} */}
        {/* raceResults:{JSON.stringify(raceResults)} */}
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
        {!isConnected && <button onClick={handleConnect}>連線</button>}
        {!isConnected && (
          <button onClick={handlePlayerData}>其他玩家填好資料傳送</button>
        )}
        {isConnected && (
          <button onClick={handleMainData}>屋主填好資料傳送</button>
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
                    <TableCell align="center">{result.horse}</TableCell>
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
                        <Box>{player.role === "main" && <MosqueIcon />}</Box>
                        <Box>{player.role}</Box>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">{player.id}</TableCell>
                    <TableCell align="right">{player.player}</TableCell>
                    <TableCell align="right">{player.betHorse}</TableCell>
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
