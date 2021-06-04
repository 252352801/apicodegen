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
