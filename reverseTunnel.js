const { Client } = require('ssh2');
const http = require('http');

// SSH connection details
const sshConfig = {
  host: 'office.example.com', // Replace with your office server's hostname or IP
  port: 22, // SSH port (default is 22)
  username: 'your-ssh-username', // Replace with your SSH username
  password: 'your-ssh-password', // Replace with your SSH password (or use privateKey for key-based auth)
};

// Local and remote details
const localPort = 8080; // Local port to forward traffic to
const remoteHost = '192.168.1.100'; // Internal office resource to access
const remotePort = 80; // Port of the internal resource

// Create an SSH client
const sshClient = new Client();

// Create an HTTP server for testing
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, you are connected to the office resource!\n');
});

// Start the HTTP server on the local port
server.listen(localPort, () => {
  console.log(`Local HTTP server running on http://localhost:${localPort}`);
});

// Handle SSH connection
sshClient.on('ready', () => {
  console.log('SSH connection established.');

  // Forward local port to remote host
  sshClient.forwardOut(
    '127.0.0.1', // Local IP to bind to
    localPort, // Local port to forward from
    remoteHost, // Remote host to forward to
    remotePort, // Remote port to forward to
    (err, stream) => {
      if (err) {
        console.error('Failed to create SSH tunnel:', err);
        process.exit(1);
      }

      console.log(`SSH tunnel created: localhost:${localPort} -> ${remoteHost}:${remotePort}`);

      // Handle incoming connections to the local HTTP server
      server.on('connection', (socket) => {
        stream.pipe(socket).pipe(stream);
      });
    }
  );
});

// Handle SSH errors
sshClient.on('error', (err) => {
  console.error('SSH connection error:', err);
  process.exit(1);
});

// Handle application exit
process.on('exit', () => {
  console.log('Closing SSH tunnel...');
  sshClient.end(); // Close the SSH connection
});

// Connect to the SSH server
sshClient.connect(sshConfig);
