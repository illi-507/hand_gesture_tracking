import { useEffect, useRef, useState } from "react";
import "./App.css";

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function App() {
  const circleRef = useRef(null);
  const [websocketReady, setWebSocketReady] = useState(false);
  const wsUrl = import.meta.env.VITE_WS_URL;
  let latestMessage = useRef(null);

  const wsConnection = useRef(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) {
      console.log("⏭️ StrictMode second effect run ignored");
      return;
    }

    hasInitializedRef.current = true;

    let retryTimer = null;
    let retryCount = 0;
    const MAX_RETRY = 5;
    const RETRY_DELAY = 1000;
    let msgCount = 0;
    const SAMPLE_RATE = 5;

    function connectWs() {
      if (retryCount >= MAX_RETRY) {
        console.warn("⛔ WebSocket retry limit reached, stop retrying");
        return;
      }

      console.log(
        `🔌 Trying to connect WebSocket... (${retryCount + 1}/${MAX_RETRY})`
      );

      const ws = new WebSocket(wsUrl);
      wsConnection.current = ws;

      ws.onopen = () => {
        console.log("🟢 WebSocket connected");
        retryCount = 0; // ✅ 连接成功后重置计数
        if (retryTimer) clearTimeout(retryTimer);
        setWebSocketReady(true);
      };

      ws.onclose = () => {
        retryCount++;

        if (retryCount >= MAX_RETRY) {
          console.warn("⛔ WebSocket disconnected, max retry reached");
          return;
        }

        console.log(
          `🔴 WebSocket disconnected, retrying in 1s... (${retryCount}/${MAX_RETRY})`
        );
        retryTimer = setTimeout(connectWs, RETRY_DELAY);
      };

      ws.onerror = () => {
        // 触发 onclose，由 onclose 统一处理 retry
        ws.close();
      };

      ws.onmessage = (event) => {
        //latestMessage.current = event.data;
        ProcessData(event);
      };

      function ProcessData1() {
        /*const x1 = true;
        if (x1) {
          console.log("-----------------------getting data", event.data);
          return;
        } */
        msgCount++;
        //console.log("msgCOunt", msgCount);
        if (msgCount % 3 !== 0) {
          return;
        }
        /* const x1 = true;
        if (x1) {
          if (msgCount % 5 === 0) {
            if (targetRef.current.x === 100) {
              targetRef.current.x = 300;
              targetRef.current.y = 300;
            } else {
              targetRef.current.x = 100;
              targetRef.current.y = 100;
            }
          }

          return;
        }*/

        /*if (msgCount % 5 !== 0) {
          return;
        }*/

        //if (latestMessage.current) {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type !== "ingress_raw" || !msg.payload) return;

          const payload = msg.payload;

          // -------------------------
          // 判断 input_type
          // -------------------------
          const isDigit = payload.includes("PerceptionInputType.DIGIT_");
          const isHand = payload.includes("PerceptionInputType.HAND_LANDMARKS");

          let bbox = null;

          // =====================================================
          // DIGIT_xxx：找非空 roi_bbox
          // =====================================================
          /*if (!isDigit) {
            return;
          } */

          if (isDigit) {
            const roiMatches = payload.match(/roi_bbox': ({[^}]+}|None)/g);

            if (roiMatches) {
              for (const roi of roiMatches) {
                if (!roi.includes("None")) {
                  const nums = roi.match(/[-\d.]+/g);
                  if (nums && nums.length === 4) {
                    const [left, top, right, bottom] = nums.map(Number);
                    bbox = { left, top, right, bottom };
                    break;
                  }
                }
              }
            }
          }

          // =====================================================
          // HAND_LANDMARKS：取 bboxes 第一个
          // =====================================================
          if (isHand) {
            const bboxMatch = payload.match(
              /bboxes': \[\{'left': ([^,]+), 'top': ([^,]+), 'right': ([^,]+), 'bottom': ([^}]+)\}\]/
            );

            if (bboxMatch) {
              const [, left, top, right, bottom] = bboxMatch;
              bbox = {
                left: Number(left),
                top: Number(top),
                right: Number(right),
                bottom: Number(bottom),
              };
            }
          }

          // -------------------------
          // 统一处理 bbox
          // -------------------------

          if (bbox) {
            const left = Math.round(bbox.left);
            const top = Math.round(bbox.top);

            const right = Math.round(bbox.right);
            const bottom = Math.round(bbox.bottom);

            const cx = Math.round((left + right) / 2);
            const cy = Math.round((top + bottom) / 2);

            console.log("📦 bbox:", left, top, right, bottom);
            console.log("🎯 center:", { x: cx, y: cy });
            targetRef.current.x = cx;
            targetRef.current.y = cy;
          }
          // latestMessage.current = null;
        } catch (err) {
          console.error("Invalid WS message:", latestMessage.current, err);
        }
        //}
      }

      function ProcessData() {
        msgCount++;
        if (msgCount % 3 !== 0) {
          return;
        }

        try {
          const msg = JSON.parse(event.data);
          if (msg.type !== "ingress_raw" || !msg.payload) return;

          const payload = msg.payload;

          // -------------------------
          // 判断 input_type
          // -------------------------
          const isDigit = payload.includes("PerceptionInputType.DIGIT_");
          const isHand = payload.includes("PerceptionInputType.HAND_LANDMARKS");

          let bbox = null;

          // =====================================================
          // DIGIT_xxx：找非空 roi_bbox
          // =====================================================
          if (isDigit) {
            const roiMatches = payload.match(/roi_bbox': ({[^}]+}|None)/g);

            if (roiMatches) {
              for (const roi of roiMatches) {
                if (!roi.includes("None")) {
                  const nums = roi.match(/[-\d.]+/g);
                  if (nums && nums.length === 4) {
                    const [left, top, right, bottom] = nums.map(Number);
                    bbox = { left, top, right, bottom };
                    break;
                  }
                }
              }
            }
          }

          // =====================================================
          // HAND_LANDMARKS：取 bboxes 第一个
          // =====================================================
          if (isHand) {
            const bboxMatch = payload.match(
              /bboxes': \[\{'left': ([^,]+), 'top': ([^,]+), 'right': ([^,]+), 'bottom': ([^}]+)\}\]/
            );

            if (bboxMatch) {
              const [, left, top, right, bottom] = bboxMatch;
              bbox = {
                left: Number(left),
                top: Number(top),
                right: Number(right),
                bottom: Number(bottom),
              };
            }
          }

          // -------------------------
          // 统一处理 bbox + 过滤
          // -------------------------
          if (bbox) {
            const left = Math.round(bbox.left);
            const top = Math.round(bbox.top);
            const right = Math.round(bbox.right);
            const bottom = Math.round(bbox.bottom);

            const width = right - left;
            const height = bottom - top;
            const area = width * height;
            const aspect = width / height;

            // 🔍 过滤规则
            if (area < 20000) {
              console.log("❌ filtered: area too small", area);
              return;
            }

            if (aspect < 0.2 || aspect > 1.5) {
              console.log("❌ filtered: bad aspect ratio", aspect);
              return;
            }

            if (left === 0 || top === 0) {
              console.log("❌ filtered: touch edge", { left, top });
              return;
            }

            // ✅ 合格的 bbox
            const cx = Math.round((left + right) / 2);
            const cy = Math.round((top + bottom) / 2);

            console.log("✅ bbox accepted:", {
              left,
              top,
              right,
              bottom,
              area,
              aspect,
            });
            console.log("🎯 center:", { x: cx, y: cy });

            const event = new CustomEvent("splash-move", {
              detail: { x: cx, y: cy },
              bubbles: true,
            });

            document.body.dispatchEvent(event);
            targetRef.current.x = cx;
            targetRef.current.y = cy;
          }
        } catch (err) {
          console.error("Invalid WS message:", event.data, err);
        }
      }

      /* setInterval(() => {
        ProcessData();
      }, 200);*/
    }

    connectWs(); // 初次连接

    return () => {
      console.log("🛑 Cleanup WebSocket");
      if (retryTimer) clearTimeout(retryTimer);
      if (wsConnection.current) wsConnection.current.close();
    };
  }, []);

  // 当前渲染位置
  const currentRef = useRef({ x: 20, y: 20 });
  //const currentRef = useRef({ x: 694, y: 245 });
  // 目标位置
  const targetRef = useRef({ x: 20, y: 20 });

  useEffect(() => {
    //document.body.style.zoom = "0.9";
  }, []);

  useEffect(() => {
    let rafId;

    const loop = () => {
      const el = circleRef.current;
      if (el) {
        const cur = currentRef.current;
        const target = targetRef.current;
        const lerp_speed = 0.15;
        cur.x = lerp(cur.x, target.x, lerp_speed);
        cur.y = lerp(cur.y, target.y, lerp_speed);

        el.style.transform = `translate(${cur.x}px, ${cur.y}px)`;
      }
      rafId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(rafId);
  }, []);

  const moveTo = (x, y) => {
    targetRef.current.x = x;
    targetRef.current.y = y;
  };

  return (
    <div className="app-container">
      <div
        className="ws-status-container"
        style={{ color: websocketReady ? "green" : "red" }}
      >
        {websocketReady ? "Connected" : "Not Connected"}
      </div>
      <div className="splash-container">
        <div ref={circleRef} className="circle" />
        {/*<SplashCursor />*/}
      </div>
    </div>
  );
}

export default App;
