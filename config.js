/**
 * 配置
 */
var Config = {
    'version': '1.0.0',
    'site': {
        'title': '唯一的日志',
        'description': '兴趣决定高度，认真你就赢了',
        'host': 'http://unsite.unjs.me/'
    },
    'list': {
        'tempFile': 'template/list.html',
        'pageFile': 'template/page.html',
        'pageSize': 10,
        'dir': 'list'
    },
    'output': {
        'base': {
            'source': 'dev',
            'target': 'dist'
        },
        'listDir': 'list',
        'lib': 'lib',
        'view': 'view'
    }
};

module.exports = Config;
