const axios = require('axios');
const chalk = require('chalk');
const qs = require('querystring');
const yaml = require('yamljs');
const fs = require('fs');
const bmp = require('bmp-js');

const site = 'https://www.oi-search.com/paintboard';

async function getToken(uid, paste) {
    const res = await axios.post(`${site}/gettoken`, qs.stringify({
        uid: uid, paste: paste
    }));
    console.log(uid + ' ' + paste);
    if (res.status == 200) {
        console.log(chalk.bold(chalk.green('[Get Token]')), chalk.bold(`${uid}:`), `Token updated to ${res.data}.`);
        return res.data;
    } else {
        console.log(chalk.bold(chalk.red('[Get Token]')), chalk.bold(`${uid}:`), res.data);
        return undefined;
    }
}

let waitlist = [], x = 0, y = 0, w = 0, h = 0, pic = [];

function getPoint() {
    if (waitlist.length == 0) return null;
    const id = parseInt(Math.floor(Math.random() * waitlist.length));
    const res = waitlist[id];
    waitlist[id] = null;
    return res;
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
    let x, y, color;
    const pt = getPoint();
    if (pt === null) {
        setTimeout(() => { paint(uid, token, paste); }, 100);
        return;
    }
    x = pt.x;
    y = pt.y;
    color = pt.color;
    const res = await axios.post(`${site}/paint`, qs.stringify({
        x: parseInt(x), y: parseInt(y), color: color,
        uid: uid.toString(), token: token
    }));
    if (res.data.status == 200) {
        console.log(chalk.bold(chalk.green('[Paint]')), chalk.bold(`${uid}:`), `Painted #${color} at (${x}, ${y}).`);
    } else {
        console.log(chalk.bold(chalk.red('[Paint]')), chalk.bold(`${uid}:`), res.data);
        if (res.data.status == 401 && paste) {
            token = getToken(uid, paste);
            if (!token) return;
        }
    }
    setTimeout(() => { paint(uid, token, paste); }, 30000);
}

async function main() {

    const configText = fs.readFileSync('_config.yaml', 'utf8');
    const config = yaml.parse(configText);
    x = config.x, y = config.y;

    for (let i = 0; i < w; i++) pic[i] = [];

    const bmpData = fs.readFileSync('picture.bmp');
    const bmpImage = bmp.decode(bmpData);

    w = bmpImage.width;
    h = bmpImage.height;

    for (let i = 0; i < w; i++) {
        pic[i] = [];
        for (let j = 0; j < h; j++) {
            const index = j * w + i;
            pic[i][j] = bmpImage.data[index * 4 + 3].toString(16).padStart(2, '0') + bmpImage.data[index * 4 + 2].toString(16).padStart(2, '0') + bmpImage.data[index * 4 + 1].toString(16).padStart(2, '0');
        }
    }

    console.log(chalk.bold(chalk.green('[Init Picture]')));

    await updatePoints();

    console.log(chalk.bold(chalk.green('[Get Board]')));

    const pasteText = fs.readFileSync('_paste.yaml', 'utf8');
    const pasteList = yaml.parse(pasteText);

    const tokenText = fs.readFileSync('_token.yaml', 'utf8');
    const tokenList = yaml.parse(tokenText);

    for (const key in pasteList) {
        const token = await getToken(key, pasteList[key]);
        if (token) paint(key, token, pasteList[key]);
    }


    for (const key in tokenList) {
        try {
            if (pasteList[key] != null);
        } catch (error) { paint(key, tokenList[key], null) }
    }
}

main();