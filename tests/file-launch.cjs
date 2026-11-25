'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const chromePath = [process.env.CHROME_BIN,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].find(candidate => candidate && fs.existsSync(candidate));
assert(chromePath, 'Install Chrome/Chromium or set CHROME_BIN to its executable.');
const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'moony-file-test-'));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let chrome, ws;

(async () => {
  chrome = spawn(chromePath, ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=0', '--user-data-dir=' + path.join(workspace, 'profile'),
    '--window-size=1280,900', 'about:blank'
  ], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let logs = '';
  chrome.stderr.on('data', chunk => { logs += chunk; });
  chrome.on('error', error => { logs += error.message; });
  for (let i = 0; i < 100 && !/DevTools listening on/.test(logs); i++) await delay(100);
  const endpoint = logs.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1];
  assert(endpoint, 'Browser did not start: ' + logs);
  const targets = await (await fetch('http://127.0.0.1:' + new URL(endpoint).port + '/json/list')).json();
  ws = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map(), exceptions = [], requests = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const task = pending.get(message.id);
      if (!task) return;
      pending.delete(message.id);
      clearTimeout(task.timer);
      if (message.error) task.reject(new Error(JSON.stringify(message.error)));
      else task.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
    else if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('Browser timeout: ' + method)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = async (expression, description) => {
    for (let i = 0; i < 100; i++) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    throw new Error('Timed out waiting for ' + description);
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Network.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__fetchAttempts=[];
    window.fetch=(...args)=>{window.__fetchAttempts.push(String(args[0]));throw new Error('File launches must not use fetch');};
    window.__media=[];
    const NativeAudio=window.Audio;
    window.Audio=function(...args){const element=new NativeAudio(...args);window.__media.push(element);return element;};
  ` });
  await send('Page.navigate', { url: pathToFileURL(path.join(root, 'index.html')).href });
  await until(`!!document.querySelector('[data-action="new"]')`, 'the real index.html menu');
  assert.equal(await evaluate('location.protocol'), 'file:');
  assert.equal(await evaluate(`JSON.parse(document.getElementById('question-bank').textContent).questions.length`), 34);
  await evaluate(`document.querySelector('[data-action="new"]').click()`);
  await until('window.__media[0].currentTime > 0', 'local MP3 playback');
  await evaluate(`document.querySelector('[data-action="story-skip"]').click();document.querySelector('[data-target="fuel"]').click()`);
  await until(`!!document.querySelector('[data-answer]')`, 'a question');
  await evaluate(`document.querySelector('[data-action="pause"]').click()`);
  assert.equal(await evaluate('window.__media[0].paused'), true);
  await evaluate(`document.querySelector('[data-action="menu"]').click()`);
  await send('Page.reload');
  await until(`!!document.querySelector('[data-action="continue"]')`, 'a saved file-based mission');
  await evaluate(`document.querySelector('[data-action="continue"]').click();document.getElementById('audio-button').click();document.querySelector('[data-action="test-music"]').click()`);
  await until('!window.__media[1].paused && window.__media[1].currentTime > 0', 'the music test');
  await evaluate(`document.querySelector('[data-action="audio-master"]').click()`);
  assert.equal(await evaluate('window.__media[1].paused && window.__media.every(element => element.volume === 0)'), true);
  await evaluate(`document.querySelector('[data-action="audio-reset"]').click();document.querySelector('[data-action="close-audio"]').click()`);
  assert.deepEqual(await evaluate('window.__fetchAttempts'), []);
  console.log('Direct index.html launch: questions, local MP3, audio test/mute, pause, save, and reload passed.');

  // Expose the game only in an isolated copy to exercise all stages quickly.
  const fixture = path.join(workspace, 'game');
  fs.mkdirSync(fixture);
  for (const name of ['index.html', 'style.css']) fs.copyFileSync(path.join(root, name), path.join(fixture, name));
  fs.cpSync(path.join(root, 'assets'), path.join(fixture, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(fixture, 'script.js'), fs.readFileSync(path.join(root, 'script.js'), 'utf8')
    .replace('const game=new Game();game.init();', 'const game=new Game();window.__game=game;window.__states=STATES;game.init();'));
  await send('Page.navigate', { url: pathToFileURL(path.join(fixture, 'index.html')).href });
  await until('Boolean(window.__game?.loaded)', 'the isolated file-based mission');
  const journey = await evaluate(`(() => {
    const g=window.__game,S=window.__states;
    const check=(condition,message)=>{if(!condition)throw new Error(message);};
    g.display.enter=()=>{};g.audio.enabled=false;g.audio.musicEnabled=false;g.newGame();
    let questions=0,repairs=0,steps=0;const seen=new Set(),mistakes=new Set();
    while(g.state!==S.VICTORY && steps++<1000){
      switch(g.state){
        case S.STORY:g.finishStory();break;
        case S.PLAY:g.interact(g.visibleTargets().find(t=>!g.done(t.id)).id);break;
        case S.QUESTION:{
          const q=g.question;
          if(q.answered){g.finishQuestion();break;}
          check(!seen.has(q.item.id),'Question repeated before the bank was used');seen.add(q.item.id);questions++;
          const stage=g.data.round+'-'+g.data.phase,wrong=!mistakes.has(stage);mistakes.add(stage);
          g.answer(wrong?(q.item.correctAnswer+1)%4:q.item.correctAnswer);break;
        }
        case S.EFFECT:{const effect=g.effect;g.effect=null;effect.next();break;}
        case S.REPAIR:repairs++;g.connect(0);g.connect(1);g.connect(2);break;
        case S.COMPLETE:g.advanceRound();break;
        case S.TRAVEL:g.travelAction(['radio','upper','scan'][g.data.travel.step]);break;
        default:throw new Error('Unexpected state: '+g.state);
      }
    }
    check(g.state===S.VICTORY&&questions===34&&repairs===4,'The full journey did not complete');
    check(g.data.correct===28&&g.data.mistakes===6&&g.data.hearts===1,'Incorrect final statistics');
    const used=g.data.used.slice();
    for(let i=0;i<34;i++){const q=g.bank.pick(used);check(q,'Retry cycling stopped');used.push(String(q.id));}
    check(new Set(used.slice(34)).size===34,'Questions repeated within the second pass');
    return {questions,repairs,correct:g.data.correct,mistakes:g.data.mistakes,hearts:g.data.hearts};
  })()`);
  assert.deepEqual(await evaluate('window.__fetchAttempts'), []);
  assert.deepEqual(exceptions, []);
  assert.equal(requests.some(url => /^https?:/.test(url)), false, 'The game requested a network resource');
  console.log('Complete file-based journey passed:', JSON.stringify(journey));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (ws) ws.close();
  if (chrome && chrome.exitCode === null) {
    const exited = new Promise(resolve => chrome.once('exit', resolve));
    chrome.kill();
    await Promise.race([exited, delay(3000)]);
  }
  // Only remove this test's unique directory under the system temporary folder.
  if (path.dirname(workspace) === path.resolve(os.tmpdir()) && path.basename(workspace).startsWith('moony-file-test-')) {
    fs.rmSync(workspace, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});
