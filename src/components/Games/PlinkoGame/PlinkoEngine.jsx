import Matter from "matter-js";

import { v4 as uuidv4 } from "uuid";
import { getPlinkoSocket } from "../../../socket/games/plinko";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { getActiveWalletType } from "../../../utils/activeWallet";

class PlinkoEngine {
  static WIDTH = 760;
  static HEIGHT = 500;

  static PADDING_X = 52;
  static PADDING_TOP = 40;
  static PADDING_BOTTOM = 28;

  static PIN_CATEGORY = 0x0001;
  static BALL_CATEGORY = 0x0002;

  static ballFrictions = {
    friction: 0.5,
    frictionAirByRowCount: {
      8: 0.0395,
      9: 0.041,
      10: 0.038,
      11: 0.0355,
      12: 0.0414,
      13: 0.0437,
      14: 0.0401,
      15: 0.0418,
      16: 0.0364,
    },
  };

  constructor(canvas, bet, rows, risk, setCurrentBinIndex) {
    this.canvas = canvas;
    this.betAmount = bet;
    this.rowCount = rows;
    this.riskLevel = risk;
    this.isBallInMotion = false;
    this.updateBinIndex = setCurrentBinIndex;

    this.updateRowCount(rows);

    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
      timing: { timeScale: 1 },
    });
    this.render = Matter.Render.create({
      engine: this.engine,
      canvas: this.canvas,
      options: {
        width: PlinkoEngine.WIDTH,
        height: PlinkoEngine.HEIGHT,
        background: "rgb(17 24 39)",
        wireframes: false,
      },
    });
    this.runner = Matter.Runner.create();

    this.pins = [];
    this.walls = [];
    this.balls = [];
    this.sensor = null;
    this.pinsLastRowXCoords = [];
    this.pinGrid = [];
    this.winsIndex = [];
    this.animations = new Set();
    this.timers = new Set();
    this.waiting = 0;

    this.placePinsAndWalls();

    this.sensor = Matter.Bodies.rectangle(
      this.canvas.width / 2,
      this.canvas.height - 5,
      this.canvas.width,
      10,
      { isSensor: true, isStatic: true, render: { visible: false } }
    );

    Matter.Composite.add(this.engine.world, [this.sensor]);
    Matter.Events.on(this.engine, "collisionStart", ({ pairs }) => {
      pairs.forEach(({ bodyA, bodyB }) => {
        if (bodyA === this.sensor) this.handleBallEnterBin(bodyB);
        else if (bodyB === this.sensor) this.handleBallEnterBin(bodyA);
      });
    });
  }

  start() {
    Matter.Render.run(this.render);
    Matter.Runner.run(this.runner, this.engine);
  }

  stop() {
    this.animations.forEach((id) => cancelAnimationFrame(id));
    this.animations.clear();
    this.timers.forEach((id) => clearTimeout(id));
    this.timers.clear();
    Matter.Render.stop(this.render);
    Matter.Runner.stop(this.runner);

    Matter.Composite.clear(this.engine.world);
    this.balls = [];
  }

  clearBallTimers(ball) {
    if (ball?.plinkoAnim) {
      cancelAnimationFrame(ball.plinkoAnim);
      this.animations.delete(ball.plinkoAnim);
      ball.plinkoAnim = null;
    }
    if (ball?.plinkoWatchdog) {
      clearTimeout(ball.plinkoWatchdog);
      this.timers.delete(ball.plinkoWatchdog);
      ball.plinkoWatchdog = null;
    }
    if (ball?.plinkoAcceptTimer) {
      clearTimeout(ball.plinkoAcceptTimer);
      this.timers.delete(ball.plinkoAcceptTimer);
      ball.plinkoAcceptTimer = null;
    }
  }

  dropBall() {
    const socket = getPlinkoSocket();
    if (!socket) return;

    const dropId = uuidv4();
    this.waiting = (this.waiting || 0) + 1;
    this.syncMotion();

    socket.emit("drop", {
      dropId,
      betAmount: Number(this.betAmount),
      rows: this.rowCount,
      risk: this.riskLevel,
      walletType: getActiveWalletType(),
    });

    const finishWait = () => {
      this.waiting = Math.max(0, (this.waiting || 0) - 1);
      this.syncMotion();
    };

    const onAccepted = (data) => {
      if (data.dropId !== dropId) return;
      socket.off("drop_accepted", onAccepted);
      socket.off("error", onDropError);
      if (acceptTimer) {
        clearTimeout(acceptTimer);
        this.timers.delete(acceptTimer);
      }
      finishWait();
      this.spawnBall(dropId, data.path, data.bin, data.multiplier);
    };

    const onDropError = ({ message, dropId: errId }) => {
      if (errId && errId !== dropId) return;
      socket.off("drop_accepted", onAccepted);
      socket.off("error", onDropError);
      if (acceptTimer) {
        clearTimeout(acceptTimer);
        this.timers.delete(acceptTimer);
      }
      finishWait();
      window.dispatchEvent(
        new CustomEvent("plinko:error", { detail: { message } })
      );
    };

    socket.on("drop_accepted", onAccepted);
    socket.on("error", onDropError);

    const acceptTimer = setTimeout(() => {
      this.timers.delete(acceptTimer);
      socket.off("drop_accepted", onAccepted);
      socket.off("error", onDropError);
      finishWait();
      window.dispatchEvent(
        new CustomEvent("plinko:error", {
          detail: { message: "Drop timed out. Try again." },
        })
      );
    }, 8000);
    this.timers.add(acceptTimer);
  }

  spawnBall(dropId, path, bin, multiplier) {
    const ballRadius = this.pinRadius * 2;
    const ball = Matter.Bodies.circle(
      PlinkoEngine.WIDTH / 2,
      0,
      ballRadius,
      {
        isStatic: false,
        friction: 0,
        frictionAir: 0,
        restitution: 0,
        collisionFilter: {
          category: PlinkoEngine.BALL_CATEGORY,
          mask: 0,
        },
        render: { fillStyle: "#ff0000" },
      }
    );

    ball.plinkoDropId = dropId;
    ball.plinkoBetAmount = Number(this.betAmount);
    ball.plinkoBin = bin;
    ball.plinkoPath = path;
    ball.plinkoMultiplier = multiplier;
    this.balls.push(ball);
    Matter.Composite.add(this.engine.world, ball);
    this.syncMotion();
    this.animateBallAlongPath(ball, path, bin);
  }

  syncMotion() {
    const active = (this.waiting || 0) > 0 || this.balls.length > 0;
    if (active === this.isBallInMotion) return;
    this.isBallInMotion = active;
    window.dispatchEvent(
      new CustomEvent("plinko:ball_state", {
        detail: { isInMotion: active },
      })
    );
  }

  waypointsForPath(path, bin) {
    const points = [{ x: PlinkoEngine.WIDTH / 2, y: 0 }];
    let rights = 0;
    const radius = Math.max(this.pinRadius, 4);

    for (let row = 0; row < path.length; row += 1) {
      const goRight = path[row] === 1;
      const pin = this.pinGrid[row]?.[rights + 1];
      if (pin) {
        points.push({ x: pin.x, y: pin.y - radius * 1.1 });
      }
      rights += goRight ? 1 : 0;
    }

    const left =
      this.pinsLastRowXCoords[bin] ??
      PlinkoEngine.WIDTH / 2 - this.pinDistanceX / 2;
    const right =
      this.pinsLastRowXCoords[bin + 1] ?? left + this.pinDistanceX;
    points.push({
      x: (left + right) / 2,
      y: PlinkoEngine.HEIGHT - 8,
    });
    return points;
  }

  animateBallAlongPath(ball, path, bin) {
    const points = this.waypointsForPath(path || [], bin);
    if (points.length < 2) {
      this.handleBallEnterBin(ball);
      return;
    }

    const segmentMs = 420;
    const hop = Math.max(16, this.pinRadius * 3.4);
    const start = performance.now();
    const totalMs = (points.length - 1) * segmentMs;
    const ease = (t) => t * t * (3 - 2 * t);

    const watchdog = setTimeout(() => {
      this.timers.delete(watchdog);
      ball.plinkoWatchdog = null;
      if (!ball.plinkoSettled) this.handleBallEnterBin(ball);
    }, totalMs + 2000);
    ball.plinkoWatchdog = watchdog;
    this.timers.add(watchdog);

    const tick = (now) => {
      if (!ball || ball.plinkoSettled) return;
      const elapsed = Math.min(totalMs, now - start);
      const span = elapsed / segmentMs;
      const index = Math.min(points.length - 2, Math.floor(span));
      const raw = span - index;
      const local = ease(raw);
      const from = points[index];
      const to = points[index + 1];
      if (!from || !to) {
        this.handleBallEnterBin(ball);
        return;
      }
      const bounce = Math.sin(Math.PI * raw) * hop;
      Matter.Body.setVelocity(ball, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(ball, 0);
      Matter.Body.setPosition(ball, {
        x: from.x + (to.x - from.x) * local,
        y: from.y + (to.y - from.y) * local - bounce,
      });

      if (elapsed < totalMs) {
        if (ball.plinkoAnim) this.animations.delete(ball.plinkoAnim);
        const frame = requestAnimationFrame(tick);
        this.animations.add(frame);
        ball.plinkoAnim = frame;
        return;
      }

      this.animations.delete(ball.plinkoAnim);
      ball.plinkoAnim = null;
      this.handleBallEnterBin(ball);
    };

    const frame = requestAnimationFrame(tick);
    this.animations.add(frame);
    ball.plinkoAnim = frame;
  }

  removeBall(ball) {
    this.clearBallTimers(ball);
    Matter.Composite.remove(this.engine.world, ball);
    this.balls = this.balls.filter((item) => item !== ball);
    this.syncMotion();
  }

  get pinDistanceX() {
    const list = {
      8: 75.31,
      9: 67.62,
      10: 60.0,
      11: 55.46,
      12: 51.08,
      13: 46.85,
      14: 43.77,
      15: 40.85,
      16: 38.08,
    };
    return list[this.rowCount];
  }

  updateRowCount(rowCount) {
    if (rowCount === this.rowCount) {
      return;
    }

    this.rowCount = rowCount;
    this.placePinsAndWalls();
  }

  get binsWidthPercentage() {
    const lastPinX =
      this.pinsLastRowXCoords[this.pinsLastRowXCoords.length - 1];
    return (lastPinX - this.pinsLastRowXCoords[0]) / PlinkoEngine.WIDTH;
  }

  get pinRadius() {
    return (24 - this.rowCount) / 2;
  }

  handleBallEnterBin(ball) {
    if (!ball || ball.plinkoSettled) return;
    ball.plinkoSettled = true;
    this.clearBallTimers(ball);

    const dropId = ball.plinkoDropId;
    const socket = getPlinkoSocket();
    const physicsBin = this.pinsLastRowXCoords.findLastIndex(
      (pinX) => pinX < ball.position.x
    );

    if (socket && dropId) {
      socket.emit("settle", { dropId });

      const onSuccess = (data) => {
        if (data.dropId && dropId && data.dropId !== dropId) return;
        socket.off("result_success", onSuccess);
        socket.off("error", onError);
        requestWalletRefresh();
        this.updateBinIndex(
          Number.isInteger(data.bin) && data.bin >= 0 ? data.bin : 0
        );
        this.balls = this.balls.filter((item) => item !== ball);
        this.syncMotion();
        window.dispatchEvent(
          new CustomEvent("plinko:result", {
            detail: {
              dropId,
              balance: data.balance,
              payout: data.payout,
              bin: data.bin,
              physicsBin,
              multiplier: data.multiplier,
            },
          })
        );
      };

      const onError = ({ message, dropId: errId }) => {
        if (errId && errId !== dropId) return;
        socket.off("result_success", onSuccess);
        socket.off("error", onError);
        requestWalletRefresh();
        this.balls = this.balls.filter((item) => item !== ball);
        this.syncMotion();
        window.dispatchEvent(
          new CustomEvent("plinko:error", { detail: { message } })
        );
      };

      socket.on("result_success", onSuccess);
      socket.on("error", onError);
    } else {
      this.balls = this.balls.filter((item) => item !== ball);
      this.syncMotion();
    }

    Matter.Composite.remove(this.engine.world, ball);
  }

  placePinsAndWalls() {
    const pinRadius = (24 - this.rowCount - 1) / 2;

    const availableHeight =
      PlinkoEngine.HEIGHT -
      PlinkoEngine.PADDING_TOP -
      PlinkoEngine.PADDING_BOTTOM;
    const verticalSpacing = availableHeight / (this.rowCount - 1);

    if (this.pins.length > 0) {
      Matter.Composite.remove(this.engine.world, this.pins);
      this.pins = [];
    }
    if (this.pinsLastRowXCoords.length > 0) {
      this.pinsLastRowXCoords = [];
    }
    this.pinGrid = [];
    if (this.walls.length > 0) {
      Matter.Composite.remove(this.engine.world, this.walls);
      this.walls = [];
    }

    for (let row = 0; row < this.rowCount; row++) {
      const pinCount = row + 3;
      const rowY = PlinkoEngine.PADDING_TOP + row * verticalSpacing;

      const rowPaddingX =
        PlinkoEngine.PADDING_X +
        ((this.rowCount - 1 - row) * this.pinDistanceX) / 2;

      for (let col = 0; col < pinCount; col++) {
        const colX =
          rowPaddingX +
          ((PlinkoEngine.WIDTH - rowPaddingX * 2) / (3 + row - 1)) * col;

        const pin = Matter.Bodies.circle(colX, rowY, pinRadius, {
          isStatic: true,
          collisionFilter: {
            category: PlinkoEngine.PIN_CATEGORY,
            mask: PlinkoEngine.BALL_CATEGORY,
          },
          render: { fillStyle: "#ffffff" },
        });

        this.pins.push(pin);
        if (!this.pinGrid[row]) this.pinGrid[row] = [];
        this.pinGrid[row][col] = { x: colX, y: rowY };

        if (row === this.rowCount - 1) {
          this.pinsLastRowXCoords.push(colX);
        }
      }
    }
    Matter.Composite.add(this.engine.world, this.pins);

    const firstPinX = this.pins[0].position.x;
    const leftWallAngle = Math.atan2(
      firstPinX - this.pinsLastRowXCoords[0],
      PlinkoEngine.HEIGHT -
        PlinkoEngine.PADDING_TOP -
        PlinkoEngine.PADDING_BOTTOM
    );
    const leftWallX =
      firstPinX -
      (firstPinX - this.pinsLastRowXCoords[0]) / 2 -
      this.pinDistanceX * 0.25;

    const leftWall = Matter.Bodies.rectangle(
      leftWallX,
      PlinkoEngine.HEIGHT / 2,
      10,
      PlinkoEngine.HEIGHT,
      {
        isStatic: true,
        angle: leftWallAngle,
        render: { visible: false },
      }
    );
    const rightWall = Matter.Bodies.rectangle(
      PlinkoEngine.WIDTH - leftWallX,
      PlinkoEngine.HEIGHT / 2,
      10,
      PlinkoEngine.HEIGHT,
      {
        isStatic: true,
        angle: -leftWallAngle,
        render: { visible: false },
      }
    );
    this.walls.push(leftWall, rightWall);
    Matter.Composite.add(this.engine.world, this.walls);
  }
}

export default PlinkoEngine;
