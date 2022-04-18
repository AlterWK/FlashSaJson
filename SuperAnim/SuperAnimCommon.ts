export namespace SuperAnim {
    const InvalidSuperAnimSpriteId: number = 0;

    export class vertex3 {
        x: number = 0;
        y: number = 0;
        z: number = 0;
        constructor(x: number, y: number, z: number) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
        }
    }

    export class SuperAnimMatrix3 {
        m: number[][] = null;

        constructor(m?: number[][]) {
            this.m = m || [
                [0.0, 0.0, 0.0],
                [0.0, 0.0, 0.0],
                [0.0, 0.0, 0.0],
            ];
        }

        LoadIdentity() {
            this.m[0][1] = 0.0;
            this.m[0][2] = 0.0;
            this.m[1][0] = 0.0;
            this.m[1][2] = 0.0;
            this.m[2][0] = 0.0;
            this.m[2][1] = 0.0;

            this.m[0][0] = 1.0;
            this.m[1][1] = 1.0;
            this.m[2][2] = 1.0;
        }

        op_ast(theMat) {
            var aResult = new SuperAnimMatrix3();
            aResult.m[0][0] = this.m[0][0] * theMat.m[0][0] + this.m[0][1] * theMat.m[1][0] + this.m[0][2] * theMat.m[2][0];
            aResult.m[0][1] = this.m[0][0] * theMat.m[0][1] + this.m[0][1] * theMat.m[1][1] + this.m[0][2] * theMat.m[2][1];
            aResult.m[0][2] = this.m[0][0] * theMat.m[0][2] + this.m[0][1] * theMat.m[1][2] + this.m[0][2] * theMat.m[2][2];
            aResult.m[1][0] = this.m[1][0] * theMat.m[0][0] + this.m[1][1] * theMat.m[1][0] + this.m[1][2] * theMat.m[2][0];
            aResult.m[1][1] = this.m[1][0] * theMat.m[0][1] + this.m[1][1] * theMat.m[1][1] + this.m[1][2] * theMat.m[2][1];
            aResult.m[1][2] = this.m[1][0] * theMat.m[0][2] + this.m[1][1] * theMat.m[1][2] + this.m[1][2] * theMat.m[2][2];
            aResult.m[2][0] = this.m[2][0] * theMat.m[0][0] + this.m[2][1] * theMat.m[1][0] + this.m[2][2] * theMat.m[2][0];
            aResult.m[2][1] = this.m[2][0] * theMat.m[0][1] + this.m[2][1] * theMat.m[1][1] + this.m[2][2] * theMat.m[2][1];
            aResult.m[2][2] = this.m[2][0] * theMat.m[0][2] + this.m[2][1] * theMat.m[1][2] + this.m[2][2] * theMat.m[2][2];
            return aResult;
        }

        op_astV(theVec) {
            return new vertex3(this.m[0][0] * theVec.x + this.m[0][1] * theVec.y + this.m[0][2], this.m[1][0] * theVec.x + this.m[1][1] * theVec.y + this.m[1][2], theVec.z);
        }

        op_astQ(theQuad) {
            var aNewQuad = theQuad;
            aNewQuad.bl.vertices = this.op_astV(theQuad.bl.vertices);
            aNewQuad.br.vertices = this.op_astV(theQuad.br.vertices);
            aNewQuad.tl.vertices = this.op_astV(theQuad.tl.vertices);
            aNewQuad.tr.vertices = this.op_astV(theQuad.tr.vertices);
            return aNewQuad;
        }
    }

    export class SuperAnimTransform {
        mMatrix: SuperAnimMatrix3 = null;

        constructor() {
            this.mMatrix = new SuperAnimMatrix3();
            this.mMatrix.LoadIdentity();
        }

        Scale(sx, sy) {
            this.mMatrix.m[0][0] *= sx;
            this.mMatrix.m[0][1] *= sx;
            this.mMatrix.m[0][2] *= sx;
            this.mMatrix.m[1][0] *= sy;
            this.mMatrix.m[1][1] *= sy;
            this.mMatrix.m[1][2] *= sy;
        }

        TransformSrc(theSrcTransform) {
            var aNewTransform = new SuperAnimTransform();
            aNewTransform.mMatrix.m[0][0] = this.mMatrix.m[0][0] * theSrcTransform.mMatrix.m[0][0] + this.mMatrix.m[0][1] * theSrcTransform.mMatrix.m[1][0];
            aNewTransform.mMatrix.m[0][1] = this.mMatrix.m[0][0] * theSrcTransform.mMatrix.m[0][1] + this.mMatrix.m[0][1] * theSrcTransform.mMatrix.m[1][1];
            aNewTransform.mMatrix.m[1][0] = this.mMatrix.m[1][0] * theSrcTransform.mMatrix.m[0][0] + this.mMatrix.m[1][1] * theSrcTransform.mMatrix.m[1][0];
            aNewTransform.mMatrix.m[1][1] = this.mMatrix.m[1][0] * theSrcTransform.mMatrix.m[0][1] + this.mMatrix.m[1][1] * theSrcTransform.mMatrix.m[1][1];
            aNewTransform.mMatrix.m[0][2] = this.mMatrix.m[0][2] + this.mMatrix.m[0][0] * theSrcTransform.mMatrix.m[0][2] + this.mMatrix.m[0][1] * theSrcTransform.mMatrix.m[1][2];
            aNewTransform.mMatrix.m[1][2] = this.mMatrix.m[1][2] + this.mMatrix.m[1][0] * theSrcTransform.mMatrix.m[0][2] + this.mMatrix.m[1][1] * theSrcTransform.mMatrix.m[1][2];
            return aNewTransform;
        }

        InterpolateTo(theNextTransform, thePct) {
            var aNewTransform = new SuperAnimTransform();
            aNewTransform.mMatrix.m[0][0] = this.mMatrix.m[0][0] * (1.0 - thePct) + theNextTransform.mMatrix.m[0][0] * thePct;
            aNewTransform.mMatrix.m[0][1] = this.mMatrix.m[0][1] * (1.0 - thePct) + theNextTransform.mMatrix.m[0][1] * thePct;
            aNewTransform.mMatrix.m[1][0] = this.mMatrix.m[1][0] * (1.0 - thePct) + theNextTransform.mMatrix.m[1][0] * thePct;
            aNewTransform.mMatrix.m[1][1] = this.mMatrix.m[1][1] * (1.0 - thePct) + theNextTransform.mMatrix.m[1][1] * thePct;
            aNewTransform.mMatrix.m[0][2] = this.mMatrix.m[0][2] * (1.0 - thePct) + theNextTransform.mMatrix.m[0][2] * thePct;
            aNewTransform.mMatrix.m[1][2] = this.mMatrix.m[1][2] * (1.0 - thePct) + theNextTransform.mMatrix.m[1][2] * thePct;
            return aNewTransform;
        }
    }

    export class Color {
        mRed: number = 0;
        mGreen: number = 0;
        mBlue: number = 0;
        mAlpha: number = 255;

        constructor(theRed?, theGreen?, theBlue?, theAlpha?) {
            this.mRed = theRed || 0;
            this.mGreen = theGreen || 0;
            this.mBlue = theBlue || 0;
            this.mAlpha = theAlpha || 255;
        }

        InterpolateTo(theNextColor, thePct) {
            return new Color(
                Math.floor(this.mRed * (1.0 - thePct) + theNextColor.mRed * thePct),
                Math.floor(this.mGreen * (1.0 - thePct) + theNextColor.mGreen * thePct),
                Math.floor(this.mBlue * (1.0 - thePct) + theNextColor.mBlue * thePct),
                Math.floor(this.mAlpha * (1.0 - thePct) + theNextColor.mAlpha * thePct)
            );
        }
    }

    export class SuperAnimHandler {
        mMainDefKey: string = '';
        mCurLabel: string = '';
        mFirstFrameNumOfCurLabel: number = 0;
        mLastFrameNumOfCurLabel: number = 0;
        mCurFrameNum: number = 0.0;
        mAnimRate: number = 0.0;
        mWidth: number = 0.0;
        mHeight: number = 0.0;
        mIsHandlerValid: boolean = false;

        constructor() {}
        IsValid() {
            return this.mIsHandlerValid;
        }
    }

    export function cloneObject(obj): any {
        var clone = {};
        for (var i in obj) {
            if (typeof obj[i] == 'object') clone[i] = cloneObject(obj[i]);
            else clone[i] = obj[i];
        }
        return clone;
    }

    export class SuperAnimObjDrawInfo {
        mSpriteId: number = InvalidSuperAnimSpriteId;
        mTransform: SuperAnimTransform = null;
        mColor: Color = null;

        constructor() {
            this.mTransform = new SuperAnimTransform();
            this.mColor = new Color();
        }
    }
}
