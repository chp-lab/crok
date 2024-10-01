const crypto = require("crypto");
function timeNow() {
  let date_time = new Date();
  let date = ("0" + date_time.getDate()).slice(-2);
  let month = ("0" + (date_time.getMonth() + 1)).slice(-2);
  let year = date_time.getFullYear();
  let hours = date_time.getHours();
  let minutes = date_time.getMinutes();
  let seconds = date_time.getSeconds();
  let time =
    year +
    "-" +
    month +
    "-" +
    date +
    " " +
    hours +
    ":" +
    minutes +
    ":" +
    seconds;
  // console.log(time);
  return time;
}

function randomString(length, chars) {
  if (!chars) {
    throw new Error("Argument 'chars' is undefined");
  }

  const charsLength = chars.length;
  if (charsLength > 256) {
    throw new Error(
      "Argument 'chars' should not have more than 256 characters" +
        ", otherwise unpredictability will be broken"
    );
  }

  const randomBytes = crypto.randomBytes(length);
  let result = new Array(length);

  let cursor = 0;
  for (let i = 0; i < length; i++) {
    cursor += randomBytes[i];
    result[i] = chars[cursor % charsLength];
  }

  return result.join("");
}

export function randomAsciiString() {
  const length = 60;
  return randomString(
    length,
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  );
}

export default { timeNow };
