/**
 * WmJs
 *
 * author: onlyfu
 * update: 2015-08-24
 */

var Http = require('http');
var Url = require('url');
var Os = require('os');
var Fs = require('fs');
var Path = require('path');
//var uglify = require('uglify-js');
//var jsp = require('uglify-js').parser;
//var pro = require('uglify-js').uglify;

var Config = require('./config');

var Server = {

    // layout对象
    layoutObject: {},
    // 解析变量对象
    parseObject: {},
    // 构建输出html的运行状态
    buildViewStatus: false,
    buildImageStatus: false,
    // 配置文件
    config: null,
    // 系统
    os: Os.platform(),
    // 版本
    version: 'dev',

    /**
     * 运行
     */
    run: function(paraConfig, route){

        var argv = process.argv;
        var argvLen = argv.length;

        if (argvLen < 2) {
            console.error('create server failed, params error');
            return false;
        }

        var port = 3000;
        var buildType = false;
        var miniFile = false;
        var apiHost = '';

        for (var i = 0; i < argvLen; i++) {

            switch (argv[i]) {
                case '-p':
                    port = argv[i + 1];
                    break;
                case '-b':
                    buildType = true;
                    break;
                case '-h':
                    apiHost = argv[i + 1];
                    break;
                case '-m':
                    miniFile = true;
                    break;
                case '-v':
                    this.version = argv[i + 1];
            }
        }

        this.config = paraConfig;

        if (buildType) {
            this.build(miniFile);
        }
    },

    /**
     * 拷贝目录
     * @param sourceDir 源目录
     * @param targetDir 目标目录
     * @param fileExt 检测文件类型
     */
    copyDir: function(sourceDir, targetDir, fileExt, miniFile) {

        var self = this;
        var paths = Fs.readdirSync(sourceDir);
        if (paths) {
            paths.forEach(function(path) {

                var sourcePath = sourceDir + '/' + path;
                var targetPath = targetDir + '/' + path;
                var mainIndex = self.config.output.base.source + '/index.html';

                if (sourcePath == mainIndex) {
                    return;
                }

                if (sourcePath.indexOf('/'+ self.config.output.view +'/') == -1 &&
                        sourcePath.indexOf('\\'+ self.config.output.view +'\\') == -1) {

                    var stat = Fs.lstatSync(sourcePath);
                    if (stat.isFile()) {
                        var extName = Path.extname(sourcePath).slice(1);
                        if (extName.match(fileExt)) {
                            var readable, writeable;
                            if (Fs.existsSync(targetDir)) {
                                console.log('复制文件: ' + sourcePath + ' => ' + targetPath);
                                if (extName == 'js') {
                                    targetPath = targetDir + '/' + path.replace('.js', '') + '.js';
                                } else if(extName == 'css') {
                                    targetPath = targetDir + '/' + path.replace('.css', '') + '.css';
                                }
                                if (miniFile && extName == 'js') {
                                    self.jsMini(sourcePath, targetPath);
                                } else {
                                    readable = Fs.createReadStream(sourcePath);
                                    writeable = Fs.createWriteStream(targetPath);
                                    readable.pipe(writeable);
                                }
                            } else {
                                console.log('创建目录: ' + targetDir);
                                Fs.mkdirSync(targetDir);
                                readable = Fs.createReadStream(sourcePath);
                                writeable = Fs.createWriteStream(targetPath);
                                readable.pipe(writeable);
                            }
                        }
                    } else if (stat.isDirectory()) {

                        if (!Fs.existsSync(targetPath)) {
                            console.log('创建目录: ' + targetPath);
                            Fs.mkdirSync(targetPath);
                        } else {
                            console.log('目录存在: ' + targetPath);
                        }
                        self.copyDir(sourcePath, targetPath, fileExt, miniFile);
                    }
                }
            });
        }
    },

    /**
     * 拷贝单个文件
     * @param sourceFile 来源文件
     */
    copyFile: function(sourceFile) {

        var self = this;
        Fs.stat(sourceFile, function(error, path) {

            if (error) {
                console.log('copyFile: ' + error);
            }

            if (path.isFile()) {
                console.log('sourceFile: ' + sourceFile);
                
                var items;
                var mainIndex;
                if (self.os == 'win32') {
                    items = sourceFile.split('\\');
                     mainIndex = self.config.output.base.source + '\\index.html';
                } else {
                    items = sourceFile.split('/');
                    mainIndex = self.config.output.base.source + '/index.html';
                }
                
                console.log(mainIndex);
                if (sourceFile == mainIndex) {
                    console.log('mainIndex, return');
                    return;
                }
                
                var targetPath = [self.config.output.base.target];
                var sourcePath = [];
                for (var i in items) {

                    sourcePath.push(items[i]);
                    if (items[i] == self.config.output.base.source) {
                        continue;
                    }

                    targetPath.push(items[i]);
                    var toPath = self.os == 'win32' ? targetPath.join('\\') : targetPath.join('/');
                    var fromPath = self.os == 'win32' ? sourcePath.join('\\') : sourcePath.join('/');
                    
                    var stat = Fs.lstatSync(fromPath);
                    if(stat.isDirectory() && !Fs.existsSync(toPath)) {
                        console.log('创建目录: ' + toPath);
                        Fs.mkdirSync(toPath);
                    } else if(stat.isFile()) {
                        var extName = Path.extname(fromPath).slice(1);
                        console.log('复制文件: ' + sourceFile + ' => ' + toPath);
                        if (extName == 'js') {
                            toPath = toPath.replace('.js', '') + '.' + self.version + '.js';
                        } else if(extName == 'css') {
                            toPath = toPath.replace('.css', '') + '.' + self.version + '.css';
                        }
                        var readable = Fs.createReadStream(sourceFile);
                        var writeable = Fs.createWriteStream(toPath);
                        readable.pipe(writeable);
                    }
                }
            }
        });
    },

    /**
     * 清空目录
     * @param targetDir
     */
    delDir: function(targetDir) {
        var self = this;
        var paths = Fs.readdirSync(targetDir);
        if (paths) {
            paths.forEach(function(path) {
                var targetPath = targetDir + '/' + path;
                var stat = Fs.lstatSync(targetPath);
                if (stat.isFile()) {
                    // 如果是文件，直接删除
                    console.log('删除文件: ' + targetPath);
                    Fs.unlinkSync(targetPath);
                } else if (stat.isDirectory()) {
                    self.delDir(targetPath);
                }
            });
        }
    },
    
    /**
     * 压缩JS
     * @params sourceList 来源JS文件
     * @params target 输出目标JS
     */
    jsMini: function(sourceList, target) {

        var result = uglify.minify(sourceList);
        Fs.writeFileSync(target, result['code'], 'utf8');
    },

    /**
     * 构建输出html
     */
    build: function(miniFile) {

        var self = this;

        console.log('## building......');
        var sourcePath = this.config.output.base.source;
        var targetPath = this.config.output.base.target;
        console.log('## clearing......');
        this.delDir(targetPath);
        console.log('## loading site info...');
        this.getSiteInfo();
        console.log('## copying static file...');
        var fileExt = /^(gif|png|jpg|css|html|js|svg|ttf|eot|woff|woff2)$/ig;
        this.copyDir(sourcePath + "/static", targetPath, fileExt);

        // 加载layout
        console.log('## loading layout...');
        var layoutPath = sourcePath + "/_layout/";
        var layouts = Fs.readdirSync(layoutPath);
        if (layouts) {
            layouts.forEach(function(layout) {
                var layoutInfo = layout.split('.');
                var layoutName = layoutInfo[0];
                self.layoutObject[layoutName] = Fs.readFileSync(layoutPath + layout, 'utf8');
            });
        }

        // 读取post
        console.log('## loading post...');
        var postPath = sourcePath + "/_post/";
        var posts = Fs.readdirSync(postPath);
        if (posts) {
            posts.reverse().forEach(function(post) {
                console.log('## building post: ' + post);
                var content = Fs.readFileSync(postPath + post, 'utf8');
                var rex = new RegExp(/\-\-\-\r*\n([\s\S]*)\r*\n\-\-\-/);
                var match = rex.exec(content);
                if (match) {
                    var contentHeaderObject = {};
                    var contentHeaderText = match[1];
                    var contentHeaderList = contentHeaderText.split("\n");
                    for (var i in contentHeaderList) {
                        var items =  contentHeaderList[i].replace("\r", "").split(":");
                        contentHeaderObject[items[0]] = items[1].replace(" ", "");
                    }

                    self.createPost(post, contentHeaderObject,
                        content.replace(rex, ""));
                } else {
                    console.log("## match post content error: " + post);
                }
            });

            // 生成列表页
            self.buildListPage(posts);
            // 生成首页
        } else {
            console.log("## no post file.");
        }
    },

    /**
     * 构建列表页
     * @param postLit 文章列表
     */
    buildListPage: function(postLit) {
        console.log("## building list page...");
    },

    /**
     * 获取站点配置信息
     */
    getSiteInfo: function() {
        var siteInfo = this.config.site;
        for (var i in siteInfo) {
            this.parseObject['site.' + i] = siteInfo[i];
        }
    },

    /**
     * 生成文章
     * @param postName
     * @param contentHeaderObject
     * @param content
     */
    createPost: function(postName, contentHeaderObject, content) {
        // 更新对象
        for (var i in contentHeaderObject) {

            this.parseObject["post." + i] = contentHeaderObject[i];
        }
        this.parseObject["post.content"] = content;

        // 获取layout对象
        var layout = this.layoutObject[contentHeaderObject.layout];
        // 解析模板
        var html = this.parseTemplate(layout);
        // 写文件
        var target =this.config.output.base.target + "/post/";
        if (!Fs.existsSync(target)) {
            Fs.mkdirSync(target);
        }
        Fs.writeFileSync(target + postName, html, 'utf8');
    },

    /**
     * 解析模板
     * @param content 要解析的内容
     */
    parseTemplate: function(content) {
        var result = content;
        for (var i in this.parseObject) {
            var parseString = new RegExp("{{ " + i + " }}", 'g');
            result = result.replace(parseString, this.parseObject[i]);
        }

        return result;
    },

    /**
     * 合并js
     */
    concatJs: function() {

        console.log('concatJs...');

        var self = this;
        var scriptContent = '';
        var executeConcat = function(sourcePath) {
            var paths = Fs.readdirSync(sourcePath);

            paths.forEach(function(path) {

                var itemPath = sourcePath + '/' + path;
                var stat = Fs.lstatSync(itemPath);
                if (stat.isDirectory()) {
                    console.log('********itemPath*********'+itemPath);
                    if(/(component|controller|model)/g.test(itemPath)) {
                        executeConcat(itemPath);
                    }
                } else if (stat.isFile()) {

                    console.log('读取文件: ' + itemPath);
                    if(/.js/g.test(itemPath)) {
                        var file = Fs.readFileSync(itemPath, 'utf8');

                        if (file) {
                            scriptContent = file + scriptContent;
                        }
                    }
                }
            });
        };

        var toSource = self.config.output.base.target;

        executeConcat(toSource);
        
        // 合并文件
        var scriptFile = toSource + '/lib/lib.'+ self.version +'.js';
        Fs.writeFileSync(scriptFile, scriptContent, 'utf8');
    },

    /**
     * 生成版本
     */
    createVersion: function(sourceDir, targetDir, miniFile) {

        var randNum = Math.floor(Math.random() * 100000 + 10000);
        this.version = 'v' + this.config.version + '.' + randNum;

        // 读取首页模板
        var sourcePath = sourceDir + '/index.html';
        var indexTemplate = Fs.readFileSync(sourcePath, 'utf8');
        indexTemplate = indexTemplate.replace(/{{ version }}/g, this.version);

        // 非压缩版本
        if(!miniFile) {
            indexTemplate = indexTemplate.replace(/<script type="text\/javascript" src="lib\/lib.*<\/script>/, '');
        }

        Fs.writeFileSync(targetDir + '/index.html', indexTemplate, 'utf8');
    },
};

module.exports = Server;
