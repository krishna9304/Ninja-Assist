require("dotenv").config();
let express = require("express");
let morgan = require("morgan");

let app = express();

const Vonage = require("@vonage/server-sdk");

const vonage = new Vonage({
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET,
  applicationId: process.env.APPLICATION_ID,
  privateKey: "./private.key",
});

app.use(morgan("tiny"));

let PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("Server Started!!");
});

vonage.calls.create(
  {
    to: [
      {
        type: "phone",
        number: "918917393628",
      },
    ],
    from: {
      type: "phone",
      number: "919508908871",
    },
    ncco: [
      {
        action: "talk",
        text: "Hello, this is a call from ninja assist. Your parents are in problem, please check them immediately",
      },
    ],
  },
  (error, response) => {
    if (error) console.error(error);
    if (response) console.log(response);
  }
);
