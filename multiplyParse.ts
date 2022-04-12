import { exec } from 'child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import path from 'path';

const execPath: string = 'F:\\MyGit\\SAJOSN\\SAJSON.exe';

function multiplyParse(filePath: string) {
    if (statSync(filePath).isDirectory()) {
        let names = readdirSync(filePath);
        for (let name of names) {
            let currentFile = path.join(filePath, name);
            if (statSync(currentFile).isDirectory()) {
                multiplyParse(currentFile);
            } else {
                parseOneFile(currentFile);
            }
        }
    } else {
        parseOneFile(filePath);
    }
}

function parseOneFile(filePath: string) {
    if (/\.sam/.test(path.extname(filePath))) {
        console.warn('resolve file: ', filePath);
        exec(execPath + ' ' + filePath, (error) => {
            if (error) {
                console.log(error);
            } else {
                // 复制当前目录下的文件
                // copyFiles(filePath);
            }
        });
    }
}

function copyFiles(currentFile: string) {
    let cdir = path.dirname(currentFile);
    let index = cdir.indexOf('assets');
    let relativePath = cdir.slice(index + 6);
    let destDir = path.join(__dirname, '../middle', relativePath);
    let paths = relativePath.split(path.sep);
    let dir = path.join(__dirname, '../middle');
    for (let p of paths) {
        dir = path.join(dir, p);
        if (!existsSync(dir)) {
            mkdirSync(dir);
        }
    }
    readdirSync(cdir).forEach((name) => {
        if (!statSync(path.join(cdir, name)).isDirectory()) {
            copyFileSync(path.join(cdir, name), path.join(destDir, name));
        }
    });
}

const filePath1 = 'G:\\CocosProjects\\dartou\\creator_wulin_heroes\\assets\\images\\effect';
const filePath = 'G:CocosProjects\\wxc\\test\\assets\\effect';

multiplyParse(filePath1);
