require("dotenv").config();
let express = require("express");
let morgan = require("morgan");
const five = require("johnny-five");
const chalk = require("chalk");
const Vonage = require("@vonage/server-sdk");

let app = express();

app.use(morgan("tiny"));

// app.use(chalk);

const vonage = new Vonage({
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET,
  applicationId: process.env.APPLICATION_ID,
  privateKey: "./private.key",
});

let PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(chalk.bgGreenBright("Server Started!!"));
  const board = new five.Board();
  board.on("connect", () => {
    console.log(chalk.bgGreenBright("Arduino connected!"));
  });
  board.on("ready", () => {
    myFun();
  });
});

app.get("/", (req, res, next) => {
  call((err, response) => {
    if (err) next(err);
    if (response) {
      res.send({
        res: true,
        msg: "Call sent",
        response,
      });
    }
  });
});

app.use((req, res, next, err) => {});

let emergency = (emerStr) => {
  console.log(chalk.redBright(emerStr));
};

let myFun = () => {
  console.clear();
  console.log("ready!");
  let millis = 0;
  let lastChanged = 0;
  let lastState = "LOW ";
  let threshold = 550;
  let beatCount = 0;
  let beatsPer5Minutes = 0;
  let notDetectableCount = 0;
  let last = 0;

  setInterval(() => {
    millis++;
    if (millis % 5000 == 0) {
      beatsPer5Minutes = beatCount;
      let bpm = beatsPer5Minutes * 4.5;
      if (bpm < 40 || bpm > 120) {
        call((err, res) => {
          if (err) console.log(chalk.red(err));
          if (res) console.log(res);
        }, bpm);
      }
      beatCount = 0;
    }
  }, 1);

  const pulseSensor = new five.Sensor(0);
  const buzzer = new five.Piezo(3);
  pulseSensor.on("data", () => {
    let str = "";
    let curr = pulseSensor.value;
    if (lastState == "LOW " && curr > threshold + 300) {
      lastState = "HIGH";
      lastChanged = millis;
      beatCount++;
    } else if (lastState == "HIGH" && curr < threshold - 300) {
      lastState = "LOW ";
      lastChanged = millis;
    }
    if (lastChanged == millis) {
      notDetectableCount = 0;
    }
    for (let i = 0; i < curr / 20; i++) {
      str += "█";
    }

    console.log(
      lastState,
      parseInt(beatsPer5Minutes * 4.5),
      chalk.greenBright(str)
    );

    if (millis > lastChanged + 1000) {
      console.log("Heartbeat not detectable!", notDetectableCount);
      let bpm = beatsPer5Minutes * 4.5;
      if (bpm < 120 && notDetectableCount % 5 == 0 && notDetectableCount) {
        emergency("Emergency call!!!");
        buzzer.frequency(1000, 500);
        call((err, response) => {
          if (err) console.log(chalk.red(err));
          if (response) console.log(chalk.cyanBright(response));
        });
      }
      buzzer.frequency(2000, 1000);
      lastChanged = millis;
      notDetectableCount++;
    }
    last = curr;
  });
};

let call = (cb, bpm) => {
  vonage.calls.create(
    {
      to: [
        {
          type: "phone",
          number: "919304296496",
        },
      ],
      from: {
        type: "phone",
        number: "919304296496",
      },
      ncco: [
        {
          action: "talk",
          text: `Hello, this is a call from ninja assist. The patient is in problem, the BPM just touched ${bpm}, please check them immediately`,
        },
      ],
    },
    (error, response) => {
      cb(error, response);
    }
  );
};
