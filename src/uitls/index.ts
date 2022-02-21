/**
 * 根据语言生成文件后缀名
 * @param lang
 * @returns
 */
export function genFileExtensionByLang(lang: string) {
    const langName = lang.toLowerCase();
    let extension = '';
    switch (langName) {
        case 'js':
        case 'javascript':
            extension = '.js';
            break;
        case 'ts':
        case 'typescript':
            extension = '.ts';
            break;
    }
    return extension;
}


/**
 * project.data.baseUrl
 * 如带有baseUrl，将会判断path中是否有包含，是的话则从path删除重复的baseUrl
 */

export function transformPaths(path: string, baseUrl: string) {
    let _path = '';
    if (baseUrl) {
        const match = path.match(new RegExp(`/${baseUrl}`));
        const index = match && match.index;
        if (index === 0) {
            const value = match[0];
            _path = path.replace(value, '');
        } else {
            _path = path;
        }
    } else {
        _path = path;
    }
    return _path;
}
