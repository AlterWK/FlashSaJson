//
//	SAJSON.cpp
//
// Copyright (c) 2013 Natural Style Co. Ltd.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

#include <stdio.h>
#include <assert.h>
#include <string>
#include <vector>
#include <map>
#include <algorithm>
#include <fstream>
#include <iostream>
#include <sstream>
#include <cstdio>
#include <cstdarg>
using namespace std;

#include "SuperAnimCommon.h"

#define SAM_VERSION 1
#define TWIPS_PER_PIXEL (20.0f)
#define LONG_TO_FLOAT (65536.0f)

#define FRAMEFLAGS_REMOVES 0x01
#define FRAMEFLAGS_ADDS 0x02
#define FRAMEFLAGS_MOVES 0x04
#define FRAMEFLAGS_FRAME_NAME 0x08

#define MOVEFLAGS_ROTATE 0x4000
#define MOVEFLAGS_COLOR 0x2000
#define MOVEFLAGS_MATRIX 0x1000
#define MOVEFLAGS_LONGCOORDS 0x0800

#ifndef max
#define max(x, y) (((x) < (y)) ? (y) : (x))
#endif

namespace SuperAnim
{
    //////////////////////////////////////////////////////////////////////////////////////////////////
    // Animation object definition

    class SuperAnimObject
    {
    public:
        int mObjectNum;
        int mResNum;
        SuperAnimTransform mTransform;
        Color mColor;
    };

    typedef std::vector<SuperAnimObject> SuperAnimObjectVector;
    typedef std::map<int, SuperAnimObject> IntToSuperAnimObjectMap;

    class SuperAnimImage
    {
    public:
        SuperAnimSpriteId mSpriteId;
        std::string mImageName;
        int mWidth;
        int mHeight;
        SuperAnimTransform mTransform;
    };
    typedef std::vector<SuperAnimImage> SuperAnimImageVector;

    class SuperAnimFrame
    {
    public:
        SuperAnimObjectVector mObjectVector;
    };
    typedef std::vector<SuperAnimFrame> SuperAnimFrameVector;
    typedef std::map<std::string, int> StringToIntMap;
    class SuperAnimLabel
    {
    public:
        std::string mLabelName;
        int mStartFrameNum;
        int mEndFrameNum;
    };
    typedef std::vector<SuperAnimLabel> SuperAnimLabelArray;
    class SuperAnimMainDef
    {
    public:
        SuperAnimFrameVector mFrames;
        int mStartFrameNum;
        int mEndFrameNum;
        int mAnimRate;
        SuperAnimLabelArray mLabels;
        int mX;
        int mY;
        int mWidth;
        int mHeight;
        SuperAnimImageVector mImageVector;
    };
    //////////////////////////////////////////////////////////////////////////////////////////////////

    typedef std::map<std::string, SuperAnimMainDef> SuperAnimMainDefMap;
    class SuperAnimDefMgr
    {
    private:
        SuperAnimMainDefMap mMainDefCache;

    private:
        SuperAnimDefMgr();
        ~SuperAnimDefMgr();

        // std::string theSuperAnimFile include the absolute path
        bool LoadSuperAnimMainDef(const std::string &theSuperAnimFile);

    public:
        static SuperAnimDefMgr *GetInstance();
        static void DestroyInstance();

        // std::string theSuperAnimFile include the absolute path
        SuperAnimMainDef *Load_GetSuperAnimMainDef(const std::string &theSuperAnimFile);
        void UnloadSuperAnimMainDef(const std::string &theName);
    };

    SuperAnimSpriteId LoadSuperAnimSprite(std::string theSpriteName)
    {
        return InvalidSuperAnimSpriteId;
    }

    void UnloadSuperSprite(SuperAnimSpriteId theSpriteId)
    {
        // none
    }
}

unsigned char *GetFileData(const char *pszFileName, const char *pszMode, unsigned long *pSize)
{
    unsigned char *pBuffer = NULL;
    *pSize = 0;
    do
    {
        // read the file from hardware
        FILE *fp = fopen(pszFileName, pszMode);
        if (!fp)
            break;

        fseek(fp, 0, SEEK_END);
        *pSize = ftell(fp);
        fseek(fp, 0, SEEK_SET);
        pBuffer = new unsigned char[*pSize];
        *pSize = fread(pBuffer, sizeof(unsigned char), *pSize, fp);
        fclose(fp);
    } while (0);
    return pBuffer;
}

std::string format(const char *fmt, ...)
{
    // 定义两个va_list 类型的变量，这种变量可以用来处理变长参数：...
    va_list args, args1;

    // 初始化args
    va_start(args, fmt);

    // args1 是 args 的一个拷贝
    va_copy(args1, args);

    // 使用nullptr和0作为前两个参数来获取格式化这个变长参数列表所需要的字符串长度
    // 使用 string(size_t n, char c) 构造函数，构造一个长度为n的字符串，内容为n个c的拷贝
    string res(1 + vsnprintf(nullptr, 0, fmt, args1), 0);
    // args1 任务完成，将其关闭，清理。
    va_end(args1);

    // 使用args来格式化要返回的字符串res， 指定长度size
    vsnprintf(&res[0], res.size(), fmt, args);
    // args 任务完成，关闭，清理
    va_end(args);

    return res;
}

int main(int argc, char *argv[])
{
    if (argc != 2)
    {
        printf("usage: SAJSON sam_path\n");
        return 1;
    }

    std::ofstream outfile;
    std::string input(argv[1]);
    input.replace(input.find(".sam"), 5, ".json");
    outfile.open(input);

    SuperAnim::SuperAnimMainDef *p = SuperAnim::SuperAnimDefMgr::GetInstance()->Load_GetSuperAnimMainDef(argv[1]);

    outfile << format("{").c_str();

    outfile << format("\"mAnimRate\":%d,", p->mAnimRate).c_str();
    outfile << format("\"mX\":%d,", p->mX).c_str();
    outfile << format("\"mY\":%d,", p->mY).c_str();
    outfile << format("\"mWidth\":%d,", p->mWidth).c_str();
    outfile << format("\"mHeight\":%d,", p->mHeight).c_str();

    outfile << format("\"mImageVector\":[").c_str();
    for (SuperAnim::SuperAnimImageVector::const_iterator i = p->mImageVector.begin(); i != p->mImageVector.end(); ++i)
    {
        outfile << format("{").c_str();
        outfile << format("\"mImageName\":\"%s\",", i->mImageName.c_str()).c_str();
        outfile << format("\"mWidth\":%d,", i->mWidth).c_str();
        outfile << format("\"mHeight\":%d,", i->mHeight).c_str();
        outfile << format("\"mTransform\":{\"mMatrix\":{\"m\":[[%f,%f,%f],[%f,%f,%f],[%f,%f,%f]]}}}",
                          i->mTransform.mMatrix.m[0][0],
                          i->mTransform.mMatrix.m[0][1],
                          i->mTransform.mMatrix.m[0][2],
                          i->mTransform.mMatrix.m[1][0],
                          i->mTransform.mMatrix.m[1][1],
                          i->mTransform.mMatrix.m[1][2],
                          i->mTransform.mMatrix.m[2][0],
                          i->mTransform.mMatrix.m[2][1],
                          i->mTransform.mMatrix.m[2][2])
                       .c_str();
        (i + 1 != p->mImageVector.end()) && (outfile << format(",").c_str());
    }
    outfile << format("],").c_str();

    outfile << format("\"mStartFrameNum\":%d,", p->mStartFrameNum).c_str();
    outfile << format("\"mEndFrameNum\":%d,", p->mEndFrameNum).c_str();

    outfile << format("\"mFrames\":[").c_str();
    for (SuperAnim::SuperAnimFrameVector::const_iterator i = p->mFrames.begin(); i != p->mFrames.end(); ++i)
    {
        outfile << format("{ \"mObjectVector\":[").c_str();
        for (SuperAnim::SuperAnimObjectVector::const_iterator j = i->mObjectVector.begin(); j != i->mObjectVector.end(); ++j)
        {
            outfile << format("{\"mObjectNum\":%d,\"mResNum\":%d,\"mTransform\":{\"mMatrix\":{\"m\":[[%f,%f,%f],[%f,%f,%f],[%f,%f,%f]]}},\"mColor\":{\"mRed\":%d,\"mGreen\":%d,\"mBlue\":%d,\"mAlpha\":%d}}",
                              j->mObjectNum,
                              j->mResNum,
                              j->mTransform.mMatrix.m[0][0],
                              j->mTransform.mMatrix.m[0][1],
                              j->mTransform.mMatrix.m[0][2],
                              j->mTransform.mMatrix.m[1][0],
                              j->mTransform.mMatrix.m[1][1],
                              j->mTransform.mMatrix.m[1][2],
                              j->mTransform.mMatrix.m[2][0],
                              j->mTransform.mMatrix.m[2][1],
                              j->mTransform.mMatrix.m[2][2],
                              j->mColor.mRed,
                              j->mColor.mGreen,
                              j->mColor.mBlue,
                              j->mColor.mAlpha)
                           .c_str();
            (j + 1 != i->mObjectVector.end()) && (outfile << format(",").c_str());
        }
        (i + 1 == p->mFrames.end()) ? (outfile << format("]}").c_str()) : (outfile << format("]},").c_str());
    }
    outfile << format("],").c_str();

    outfile << format("\"mLabels\":[").c_str();
    for (SuperAnim::SuperAnimLabelArray::const_iterator i = p->mLabels.begin(); i != p->mLabels.end(); ++i)
    {

        outfile << format("{\"mLabelName\":\"%s\",\"mStartFrameNum\":%d,\"mEndFrameNum\":%d}",
                          i->mLabelName.c_str(),
                          i->mStartFrameNum,
                          i->mEndFrameNum)
                       .c_str();
        (i + 1 != p->mLabels.end()) && (outfile << format(",").c_str());
    }
    outfile << format("]").c_str();

    outfile << format("}").c_str();

    outfile.close();

    string msg = format("Successfully! ");
    printf("%s \n", msg.c_str());

    return 0;
}
