const { io } = require('socket.io-client');
const socket = io('https://gb-gq13.onrender.com' /*your url*/, {
	query: {
		verifyToken: "b0b9ae978386b38b2fd5449700de741a9cf19a43d366c64a607b83253e2b110e"
	}
});

const channel = "uptime";
socket.on(channel, data => {
	console.log(data);
});

socket.on('disconnect', (e) => {
	console.log('Disconnect', e);
	/*
	 * Your handler code
	 */
});

socket.on('connect', () => {
	console.log('Connect to socket successfully');
	/*
	 * Your handler code
	 */
});

socket.on('connect_error', err => {
	console.log('Connect error', err);
	/*
	 * Your handler code
	 */
});