import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { Flash, Animation, MLabel, Element, ColorValue, MObjectVector, Position, Translate, ScaleValue } from './types';
import { parse } from './unmatrix';

let log: string = '';

function initBaseInfo(animation: Animation, label: MLabel, flash: Flash) {
    animation.__type__ = 'cc.AnimationClip';
    animation._name = label.mLabelName;
    animation._objFlags = 0;
    animation._native = '';
    animation._duration = Number(((label.mEndFrameNum - label.mStartFrameNum + 1) * (1 / flash.mAnimRate)).toFixed(18));
    animation.sample = flash.mAnimRate;
    animation.speed = 1;
    animation.wrapMode = 1;
    animation.events = [];
}

function queryAnimationObject(matrix: number[][]) {
    return parse([matrix[0][0], matrix[1][0], matrix[0][1], matrix[1][1], matrix[0][2], matrix[1][2]]);
}

function createOneElement() {
    let element: Element = {} as Element;
    element.comps = {
        ['cc.Sprite']: {
            spriteFrame: [],
        },
    };
    element.props = {
        position: [],
        scale: [],
        opacity: [],
        color: [],
        angle: [],
    };
    return element;
}

function createOneColorValue(object: MObjectVector) {
    let color: ColorValue = {
        __type__: 'cc.Color',
        r: object.mColor.mRed,
        g: object.mColor.mGreen,
        b: object.mColor.mBlue,
        a: object.mColor.mAlpha,
    };
    return color;
}

function createOnePositionValue(translate: Translate) {
    let position: number[] = [translate.translateX, translate.translateY, 0];
    return position;
}

function createOneScaleValue(translate: Translate) {
    let scale: ScaleValue = {
        __type__: 'cc.Vec2',
        x: -translate.scaleX,
        y: -translate.scaleY,
    };
    return scale;
}

interface Cache {
    uuid: string;
    path: string;
}

const frameCache = new Map<string, Cache[]>();

// !:此处查找creator中资源的uuid映射
function readeAllResources(filePath: string) {
    if (statSync(filePath).isDirectory()) {
        let names = readdirSync(filePath, { encoding: 'utf-8' });
        for (let name of names) {
            let currentFile = path.join(filePath, name);
            if (statSync(currentFile).isDirectory()) {
                readeAllResources(currentFile);
            } else {
                if (/\.json/.test(path.extname(currentFile))) {
                    let file = readFileSync(currentFile, { encoding: 'utf-8' });
                    let object = JSON.parse(file);
                    // 查找不属于精灵表中的精灵帧
                    if (object['__type__'] == 'cc.SpriteFrame' && object['content'] /* && !object['content']['atlas'] */) {
                        let frameName = object['content']['name'];
                        if (!frameCache.has(frameName)) {
                            frameCache.set(frameName, []);
                        }
                        let caches = frameCache.get(frameName);
                        let uuid = name.replace(path.extname(currentFile), '');
                        let same: boolean = false;
                        for (let cache of caches) {
                            if (cache.uuid == uuid) {
                                same = true;
                                break;
                            }
                        }
                        if (!same) {
                            caches.push({ uuid: uuid, path: currentFile });
                        }
                    }
                }
            }
        }
    }
}

const filePath = 'G:\\CocosProjects\\wxc\\test\\library\\imports';
const filePath1 = 'G:\\CocosProjects\\dartou\\creator_wulin_heroes\\library\\imports';

readeAllResources(filePath1);

console.log('load resources finish');

let file: string = '';
frameCache.forEach((caches, name) => {
    if (caches.length > 1) {
        console.warn('出现同名精灵帧，覆盖原有uuid，需要避免同名');
        console.warn('同名精灵帧：', name);
        file += name + ':\n';
        caches.forEach((cache) => {
            console.warn(cache.path);
            file += '"' + cache.path + '"' + '\n';
        });
        file += '\n';
    }
});
writeFileSync(path.join(__dirname, '../log', 'same.log'), file);

// !:这里只是查到了png的uuid，不适用于spriteFrame
function searchUUIDByName(name: string) {
    name = name.replace('.png', '');
    return frameCache.get(name)[0].uuid || '';
}

function initAnimationInfo(animation: Animation, label: MLabel, flash: Flash, destDir: string) {
    animation.curveData = { paths: {} };
    let paths = animation.curveData.paths;
    let frames = flash.mFrames.splice(label.mStartFrameNum, label.mEndFrameNum);
    let maxObjIdx: number = 0;
    frames.forEach((frame, index) => {
        let objects = frame.mObjectVector;
        for (let object of objects) {
            let objectName = object.mObjectNum;
            if (objectName > maxObjIdx) {
                maxObjIdx = objectName;
            }
            if (!paths[objectName]) {
                paths[objectName] = createOneElement();
            }
            if (paths[objectName].props.opacity.length < index && paths[objectName].props.opacity.length == 0) {
                paths[objectName].props.opacity.push({ frame: 0, value: 0, curve: 'constant' });
            }
            let frameTime: number = Number((index * (1 / flash.mAnimRate)).toFixed(17));
            let translate: Translate = queryAnimationObject(object.mTransform.mMatrix.m);
            let color = createOneColorValue(object);
            let opacity = color.a;
            color.a = 255; //颜色的透明度不进行变化
            paths[objectName].props.angle.push({ frame: frameTime, value: -translate.rotate });
            paths[objectName].props.opacity.push({ frame: frameTime, value: opacity });
            paths[objectName].props.position.push({ frame: frameTime, value: createOnePositionValue(translate) });
            paths[objectName].props.color.push({ frame: frameTime, value: color });
            paths[objectName].props.scale.push({ frame: frameTime, value: createOneScaleValue(translate) });
            let spriteName = flash.mImageVector[object.mResNum].mImageName;
            paths[objectName].comps['cc.Sprite'].spriteFrame.push({
                frame: frameTime,
                value: {
                    __uuid__: searchUUIDByName(spriteName),
                },
            });
        }
    });
    eliminateSuperfluousFrames(animation);
    console.log(animation._name, ',maxObjIdx: ', maxObjIdx);
    log += '"' + destDir + '"' + ':' + animation._name + ': ' + maxObjIdx + '\n';
}

function eliminateSuperfluousFrames(animation: Animation) {
    for (let key in animation.curveData.paths) {
        let element: Element = animation.curveData.paths[key];
        let scaleRange: number[] = [];
        let angleRange: number[] = [];
        let opacityRange: number[] = [];
        let colorRange: number[] = [];
        let positionRange: number[] = [];
        let frameRange: number[] = [];
        querySameRange(
            element.props.scale,
            (a, b) => {
                return a.value.x == b.value.x && a.value.y == b.value.y;
            },
            scaleRange
        );
        querySameRange(
            element.props.angle,
            (a, b) => {
                return a.value == b.value;
            },
            angleRange
        );
        querySameRange(
            element.props.opacity,
            (a, b) => {
                return a.value == b.value;
            },
            opacityRange
        );
        querySameRange(
            element.props.color,
            (a, b) => {
                return a.value.r == b.value.r && a.value.g == b.value.g && a.value.b == b.value.b;
            },
            colorRange
        );
        querySameRange(
            element.props.position,
            (a, b) => {
                return a.value[0] == b.value[0] && a.value[1] == b.value[1];
            },
            positionRange
        );
        querySameRange(
            element.comps['cc.Sprite'].spriteFrame,
            (a, b) => {
                return a.value.__uuid__ == b.value.__uuid__;
            },
            frameRange
        );
        mergeSameFrames(element.props.scale, scaleRange);
        mergeSameFrames(element.props.angle, angleRange);
        mergeSameFrames(element.props.opacity, opacityRange);
        mergeSameFrames(element.props.color, colorRange);
        mergeSameFrames(element.props.position, positionRange);
        mergeSameFrames(element.comps['cc.Sprite'].spriteFrame, frameRange);
    }
}

function querySameRange<T>(array: T[], predicate: (a: T, b: T) => boolean, ranges: number[], startIdx?: number, ednIdx?: number) {
    startIdx = startIdx ?? 0;
    ednIdx = ednIdx ?? 0;
    for (let i = startIdx; i < array.length; ++i) {
        let first = array[i];
        startIdx = i;
        for (let j = i + 1; j < array.length; ++j) {
            let second = array[j];
            if (predicate(first, second)) {
                ednIdx = j;
            } else {
                break;
            }
        }
        if (ednIdx > startIdx) {
            ranges.push(startIdx, ednIdx);
            querySameRange(array, predicate, ranges, ednIdx + 1, ednIdx);
            break;
        }
    }
}

function mergeSameFrames<T>(array: { curve?: string }[], ranges: number[]) {
    if (ranges.length == 0) {
        return;
    }
    if (ranges.length % 2 != 0) {
        console.error('invalid params');
        return;
    }
    let delCount: number = 0;
    for (let i = 0; i < ranges.length; i += 2) {
        let startIdx = ranges[i] - delCount;
        let ednIdx = ranges[i + 1] - delCount;
        array[startIdx].curve = 'constant';
        delCount = delCount + ednIdx - startIdx - 1;
        array.splice(startIdx + 1, ednIdx - startIdx - 1);
    }
}

function writeToFile(animation: Animation, destDir: string) {
    let output = JSON.stringify(animation, null, 2);
    let fileName: string = path.join(destDir, animation._name + '.anim');
    writeFileSync(fileName, output);
}

function convertFlashToAnimation(flash: Flash, destDir: string) {
    if (!flash.mImageVector || !flash.mImageVector.length) {
        console.error('parse error, isn`t sam file');
        return;
    }
    /* for (let image of flash.mImageVector) {
        let translate: Translate = queryAnimationObject(image.mTransform.mMatrix.m);
        console.log('image info: ', JSON.stringify(translate), flash.mImageVector.length);
    } */
    for (let label of flash.mLabels) {
        let animation = new Animation();
        initBaseInfo(animation, label, flash);
        initAnimationInfo(animation, label, flash, destDir);
        writeToFile(animation, destDir);
    }
    console.log('convert success');
}

function convertOneFile(filePath: string) {
    if (/\.json/.test(path.extname(filePath))) {
        let input = JSON.parse(readFileSync(filePath, { encoding: 'utf-8' }));
        convertFlashToAnimation(input, path.dirname(filePath));
    }
}

function multiplyConvert(filePath: string) {
    if (statSync(filePath).isDirectory()) {
        let names = readdirSync(filePath);
        for (let name of names) {
            let currentFile = path.join(filePath, name);
            if (statSync(currentFile).isDirectory()) {
                multiplyConvert(currentFile);
            } else {
                convertOneFile(currentFile);
            }
        }
    } else {
        convertOneFile(filePath);
    }
}

let inputPath = 'G:CocosProjects\\wxc\\test\\assets\\effect';
let inputPath1 = 'G:\\CocosProjects\\dartou\\creator_wulin_heroes\\assets\\images\\effect';
let inputPath2 = 'G:CocosProjects\\wxc\\test\\assets\\effect\\chutou\\chutou.json';
let inputPath3 = 'F:\\MyGit\\SAJOSN\\middle\\images\\effect\\button_flame\\button_flame.json';
multiplyConvert(inputPath1);
writeFileSync(path.join(__dirname, '../log', 'node.log'), log);
