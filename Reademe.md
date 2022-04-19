# 使用方法

1.tsc执行脚本编译

2.sam转json
node ./temp/multiplyParse.js "flash动画目录或文件"

3.json转anim文件
node ./temp/multiplyConvert.js "creator uuid映射目录" "flash动画目录或文件" "True" --最后这个参数只要不是空就会写入数据，不填则不会更新写入anim文件

4.使用anim文件创建animation
