export class Animation {
    __type__: string;
    _name: string;
    _objFlags: number;
    _native: string;
    _duration: number;
    sample: number;
    speed: number;
    wrapMode: number;
    curveData: CurveData;
    events: any[];
}

export interface CurveData {
    props?: Props;
    comps?: Comps;
    paths?: Paths;
}

export interface Comps {
    'cc.Sprite': CcSprite;
}

export interface CcSprite {
    spriteFrame: SpriteFrame[];
}

export interface SpriteFrame {
    frame: number;
    value: SpriteFrameValue;
}

export interface SpriteFrameValue {
    __uuid__: string;
}

export interface Paths {
    [index: string]: Element;
}

export interface Element {
    props: Props;
    comps: Comps;
}

export interface Props {
    position: Position[];
    scale: Scale[];
    angle: Angle[];
    opacity: Opacity[];
    color: Color[];
}

export interface Angle {
    frame: number;
    value: number;
    curve?: string;
}

export interface Color {
    frame: number;
    value: ColorValue;
    curve?: string;
}

export interface ColorValue {
    __type__: string;
    r: number;
    g: number;
    b: number;
    a: number;
}

export interface Opacity {
    frame: number;
    value: number;
    curve?: string;
}

export interface Position {
    frame: number;
    value: number[];
    curve?: string;
}

export interface Scale {
    frame: number;
    value: ScaleValue;
    curve?: string;
}

export interface ScaleValue {
    __type__: string;
    x: number;
    y: number;
}

export interface Flash {
    mAnimRate: number;
    mX: number;
    mY: number;
    mWidth: number;
    mHeight: number;
    mImageVector: MImageVector[];
    mStartFrameNum: number;
    mEndFrameNum: number;
    mFrames: MFrame[];
    mLabels: MLabel[];
}

export interface MFrame {
    mObjectVector: MObjectVector[];
}

export interface MObjectVector {
    mObjectNum: number;
    mResNum: number;
    mTransform: MTransform;
    mColor: MColor;
}

export interface MColor {
    mRed: number;
    mGreen: number;
    mBlue: number;
    mAlpha: number;
}

export interface MTransform {
    mMatrix: MMatrix;
}

export interface MMatrix {
    m: Array<number[]>;
}

export interface MImageVector {
    mImageName: string;
    mWidth: number;
    mHeight: number;
    mTransform: MTransform;
}

export interface MLabel {
    mLabelName: string;
    mStartFrameNum: number;
    mEndFrameNum: number;
}

export interface Translate {
    translateX: number;
    translateY: number;
    rotate: number;
    skew: number;
    scaleX: number;
    scaleY: number;
}
