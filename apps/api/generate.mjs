import { spawn } from 'child_process';

const child = spawn('npx', ['drizzle-kit', 'generate'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: __dirname
});

child.stdout.on('data', (data) => {
  const str = data.toString();
  console.log(str);
  if (str.includes('You\'re about to add user_username_unique unique constraint')) {
     child.stdin.write('\n'); // press enter (no truncate?) wait, if it asks to truncate, default is yes/no?
  }
  if (str.includes('Do you want to truncate user table?')) {
     child.stdin.write('n\n');
  }
  if (str.includes('categories')) {
     // If it asks about renaming column
     child.stdin.write('y\n');
  }
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
});

child.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
  process.exit(code);
});
