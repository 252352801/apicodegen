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

export function matchStar(pattern: string, replacePattern: string, search: string): string | undefined {
    if (search.length < pattern.length) {
        return undefined;
    }
    if (pattern === '*') {
        return createPath(replacePattern, search);
    }
    const star = pattern.indexOf('*');
    if (star === -1) {
        return undefined;
    }
    const part1 = pattern.substring(0, star);
    const part2 = pattern.substring(star + 1);
    if (search.substr(0, star) !== part1) {
        return undefined;
    }
    if (search.substr(search.length - part2.length) !== part2) {
        return undefined;
    }
    return createPath(replacePattern, search.substr(star, search.length - part2.length));
}

export function createPath(pattern: string, search: string) {
    if (pattern.indexOf('*') !== -1) {
        const star = pattern.substring(0, pattern.indexOf('*'));
        return star + search;
    } else {
        return search;
    }
}
