/* eslint-disable */
'use strict';

const Iroh = require('iroh');

let code = `
  function main(n) {
    let res = 0;
    let ii = 0;
    while (++ii < 10000) {
      res += ii;
    };
    return res;
  };
  main(3);
`;

// initialise
let stage = new Iroh.Stage(code);

let now = 0;

// function call
stage.addListener(Iroh.CALL)
.on("before", (e) => {
if (e.name === "main") {
    now = performance.now();
}
})
.on("after", (e) => {
if (e.name === "main") {
    let then = performance.now();
    console.log(e.name, "took", then - now, "ms");
}
});

// run script
eval(stage.script);