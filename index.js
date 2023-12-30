const axios = require('axios');
const chalk = require('chalk');
const qs = require('querystring');
const yaml = require('yamljs');

const site = 'https://www.oi-search.com/paintboard';

async function getToken(uid, paste) {
    const res = axios.post(`${site}/gettoken`, qs.stringify({
        uid: uid, paste: paste
    }));
    if (res.status == 200) {
        console.log(chalk.bold(chalk.green('[Get Token]')), chalk.bold(`${uid}:`), `Token updated to ${res.data}.`);
        return res.data;
    } else {
        console.log(chalk.bold(chalk.red('[Get Token]')), chalk.bold(`${uid}:`), res.data);
        return undefined;
    }
}

let waitlist = [], x = 0, y = 0, w = 0, h = 0;

function getPoint() {
    const id = parseInt(Math.floor(Math.random() * waitlist.length));
    return waitlist[id];
}

function resolve(code) {
    const lines = code.split(/\s/);
    const board = [];
    for (let i = 0; i < lines.length; i++) {
        board.push(lines[i].match(/(.{6})/g));
    }
    return board;
}

async function updatePoints() {
    const res = await axios.get(`${site}/board`);
    if (res.status != 200) {
        console.log(chalk.bold(chalk.red('[Error]')), chalk.bold(`Status code ${res.status}:`), res.data);
        setTimeout(() => { updatePoints(); }, 1000);
    } else {
        const board = resolve(res.data);
        const WaitList = [];
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                if (pic[i][j] != 'gggggg' && pic[i][j] != board[i + x][j + y]) {
                    WaitList.push({ x: i + x, y: j + y, color: pic[i][j] });
                }
            }
        }
        waitlist = WaitList;
        setTimeout(() => { updatePoints(); }, 100);
    }
}

async function paint(uid, token, paste) {
    const { x, y, color } = getPoint();
    const res = await axios.post(`${site}/paint`, qs.stringify({
        x: x, y: y, color: color,
        uid: uid, token: token
    }));
    if (res.status == 200) {
        console.log(chalk.bold(chalk.green('[Paint]')), chalk.bold(`${uid}:`), `Painted #${color} at (${x}, ${y}).`);
    } else {
        console.log(chalk.bold(chalk.red('[Paint]')), chalk.bold(`${uid}:`), res.data);
        if (res.status == 401 && paste) {
            token = getToken(uid, paste);
            if (!token) return;
        }
    }
    setTimeout(() => { paint(uid, token, paste); }, 30000);
}

async function main() {
    
    updatePoints();
}