# papercup
A reliable communication channel over UDP.

## Usage

``` javascript
const PaperCup = require("papercup");
const receiver = new PaperCup();

receiver.on("message", msg => {
	console.log(msg);
});

receiver.bind(5000);
```


``` javascript
const PaperCup = require("papercup");
const sender = new PaperCup();

sender.message("hi there!", { port: 5000 }, () => {
	console.log("data has been sent and received by the recipient!");
});
```
