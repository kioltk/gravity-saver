var saver = require("../index");
var parser = require("gravity-parser");
var fs = require("fs");
async function example() {
  var levels = await parser("original.mrg");
  await saver("result.mrg", levels);
  var original = await fs.readFileAsync("original.mrg");
  var result = await fs.readFileAsync("result.mrg");
  fs.unlink("result.mrg");
  process.exit(original.toString() == result.toString() ? 0 : 1);
}
example();
