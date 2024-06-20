import { useState, useEffect, useRef } from "react";
import { Box, Button, TextField } from "@mui/material";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import Clipboard from "clipboard";

const ClipboardComponent = ({ myid }) => {
  const [inputValue, setInputValue] = useState(myid || "");
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!myid) return; // 這個錯誤是因為在組件的初始渲染時，TextField 可能是未受控的（沒有設置 value），但後來變成受控的（設置了 value）。為了解決這個問題，我們需要確保 TextField 在初始渲染時就有一個定義好的 value。
    setInputValue(myid);
  }, [myid]);

  useEffect(() => {
    const clipboard = new Clipboard(buttonRef.current);

    clipboard.on("success", (e) => {
      console.log("Text copied to clipboard:", e.text);
      e.clearSelection();
    });

    clipboard.on("error", (e) => {
      console.error("Failed to copy text:", e);
    });

    return () => {
      clipboard.destroy();
    };
  }, []);

  return (
    <Box sx={{ display: "flex", gap: 1, mt: 5 }}>
      <TextField
        label={"自己的 id"}
        id="copyInput"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        variant="outlined"
        style={{ marginBottom: "10px", width: "100%" }}
      />
      <Button
        ref={buttonRef}
        variant="contained"
        color="primary"
        startIcon={<ContentCutIcon />}
        data-clipboard-target="#copyInput"
        style={{ height: "56px" }}
      ></Button>
    </Box>
  );
};

export default ClipboardComponent;
