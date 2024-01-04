const axios = require('axios');
const bmp = require('bmp-js');
const chalk = require('chalk');
const fs = require('fs');
const qs = require('querystring');
const yaml = require('yamljs');

const site = 'https://www.oi-search.com/paintboard';

let waitlist = [], x = 0, y = 0, w = 0, h = 0, pic = [];

function getPoint() {
    if (waitlist.length == 0) return {};
    const id = parseInt(Math.floor(Math.random() * waitlist.length));
    const res = waitlist[id];
    waitlist[id] = {};
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
    try {
        const res = await axios.get(`${site}/board`);
        if (res.status == 200) {
            const board = resolve(res.data);
            let WaitList = [], correct = 0, totalNotWhite = 0, correctNotWhite = 0;
            for (let i = 0; i < w; i++) {
                for (let j = 0; j < h; j++) {
                    if (pic[i][j] != board[i + x][j + y]) {
                        WaitList.push({ x: i + x, y: j + y, color: pic[i][j] });
                    } else {
                        correct++;
                        if (pic[i][j] != 'ffffff') {
                            correctNotWhite++;
                        }
                    }
                    if (pic[i][j] != 'ffffff') {
                        totalNotWhite++;
                    }
                }
            }
            // if (WaitList.findIndex(x => x.color != 'ffffff') != -1) ;
            //     WaitList = WaitList.filter(x => x.color != 'ffffff');
            waitlist = WaitList;
            console.log(chalk.bold(chalk.green('[Get Board]')), `Success. Correct ${correct} / ${w * h}. Correct(except white) ${correctNotWhite} / ${totalNotWhite}.`);
            setTimeout(() => { updatePoints(); }, 1000)
        } else {
            console.log(chalk.bold(chalk.red('[Get Board]')), `Network error ${res.status}.`);
            setTimeout(() => { updatePoints(); }, 1000);
        }
    } catch (error) {
        console.log(chalk.bold(chalk.red('[Get Board]')), `Unknown error.`);
        setTimeout(() => { updatePoints(); }, 1000);
    }
}

async function paint(uid, token) {
    try {
        const { x, y, color } = getPoint();
        if (x == undefined) {
            setTimeout(() => { paint(uid, token); }, 100);
            return;
        }
        const res = await axios.post(`${site}/paint`, qs.stringify({
            x: parseInt(x), y: parseInt(y), color: color,
            uid: uid.toString(), token: token
        }));
        if (res.status == 200) {
            if (res.data.status == 200) {
                console.log(chalk.bold(chalk.green('[Paint]')), chalk.bold(`${uid}:`), `Painted #${color} at (${x}, ${y}).`);
            } else {
                console.log(chalk.bold(chalk.red('[Paint]')), chalk.bold(`${uid}:`), res.data.data);
            }
            setTimeout(() => { paint(uid, token); }, 30000);
        } else {
            console.log(chalk.bold(chalk.red('[Paint]')), chalk.bold(`${uid}:`), `Network error ${res.status}.`);
            setTimeout(() => { paint(uid, token); }, 1000);
        }
    } catch (error) {
        console.log(chalk.bold(chalk.red('[Paint]')), chalk.bold(`${uid}:`), `Unknown error.`);
        setTimeout(() => { paint(uid, token); }, 1000);
    }
}

async function main() {

    const configText = fs.readFileSync('_config.yaml', 'utf8');
    const config = yaml.parse(configText);
    x = config.x, y = config.y;

    for (let i = 0; i < w; i++) pic[i] = [];

    const bmpData = fs.readFileSync('_picture.bmp');
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

    const tokenText = fs.readFileSync('_tokens.yaml', 'utf8');
    const tokenMap = yaml.parse(tokenText);
    const tokenList = [];
    for (const key in tokenMap) {
        tokenList.push({ uid: key, token: tokenMap[key] });
    }
    
    const timeInterval = 30000 / tokenList.length;
    let start = (id) => {
        paint(tokenList[id].uid, tokenList[id].token);
        if (id + 1 < tokenList.length) {
            setTimeout(() => { start(id + 1) }, timeInterval);
        }
    };
    start(0);
}

main();