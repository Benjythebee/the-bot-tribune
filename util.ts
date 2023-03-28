export function replaceBreaksWithParagraphs(input:string) {
    input = filterEmpty(input.split('\n')).join('</p><p>');
    return '<p>' + input + '</p>';
}


function filterEmpty(arr:string[]) {
    var new_arr = [];
    
    for (var i = arr.length-1; i >= 0; i--)
    {
        if (arr[i] != "")
            new_arr.push(arr.pop());
        else
            arr.pop();
    }
    
    return new_arr.reverse();
};


/**
 * This method can go away in favor of only sending 'Accept-Version` headers
 * once the Ghost API removes a concept of version from it's URLS (with Ghost v5)
 *
 * @param {string} [version] version in `v{major}` format
 * @returns {string}
 */
export const resolveAPIPrefix = (version:string) => {
    let prefix;

    // NOTE: the "version.match(/^v5\.\d+/)" expression should be changed to "version.match(/^v\d+\.\d+/)" once Ghost v5 is out
    if (version === 'v5' || version === undefined || version.match(/^v5\.\d+/)) {
        prefix = `/admin/`;
    } else if (version.match(/^v\d+\.\d+/)) {
        const versionPrefix = (/^(v\d+)\.\d+/.exec(version) as any)[1];
        prefix = `/${versionPrefix}/admin/`;
    } else {
        prefix = `/${version}/admin/`;
    }

    return prefix;
};