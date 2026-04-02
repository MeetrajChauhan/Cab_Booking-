const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Restarting server...');

// Kill any existing node processes
const { exec } = require('child_process');

exec('pkill -f "node server.js"', (error, stdout, stderr) => {
  console.log('Killed existing processes');
  
  // Wait a moment and start new server
  setTimeout(() => {
    console.log('🚀 Starting new server...');
    const server = spawn('node', ['server.js'], {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    server.on('close', (code) => {
      console.log(`Server exited with code ${code}`);
    });
  }, 2000);
});
