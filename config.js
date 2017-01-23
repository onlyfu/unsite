// 配置

var Config = {
    'site': {
        'title': '唯一的日志',
        'description': '兴趣决定高度，认真你就赢了',
        'host': 'http://localhost/unsite/dist/'
    },
    'list': {
        'tempFile': 'template/list.html',
        'pageFile': 'template/page.html',
        'pageSize': 10,
        'dir': 'list'
    },
    'version': '2.0.0',
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
