/**
 * Call callback if page is loaded, or retry.
 * @param {Function} callback - call when loaded.
 */
function callWhenReadyToGo(callback) {
    var START_TIME = new Date().getTime();
    var RETRY_INTERVAL = 1000;
    var RETRY_MAX = 22; // 0 => no limit of retries.
    var RETRY_UNTIL = START_TIME + 20000; // 0 => retry forever.
    var LOADING_PATTERNS = [/^loading/i, /^isloading/i];
    var URL_PATTERNS = [/(loading|spinner|loader)\.(gif|jpg|png)/i];
    var LIST_SELECTORS = ['ul', 'ol', 'table', 'tbody', 'select'].join(', ');
    var ITEM_SELECTORS = ['li', 'tr', 'td', 'option'].join(', ');
    var VERBOSITY = 1;

    var state = {
        retryCount: 0,
        listCount: 0,
        itemCount: 0
    };

    function isMemberInPatternList(members, patterns) {
        var found = false, i, ii, member, j, jj, pattern;
        for (i = 0, ii = members.length; i < ii && !found; i++) {
            member = members[i];
            for (j = 0, jj = patterns.length; j < jj && !found; j++) {
                pattern = patterns[j];
                found = pattern.test(member);
            }
        }
        return found;
    }

    var LOADING_RULES = [
        function() {
            // If any element displays text "loading", the page is loading.
            var classLoading = false;
            var elementList = document.querySelectorAll("*");
            var element, classNames, i, ii;
            for (i = 0, ii = elementList.length; i < ii && !classLoading; i++) {
                element = elementList[i];
                if (element.className && typeof element.className === 'string') {
                    classNames = element.className.split(/\s+/);
                    classLoading = isMemberInPatternList(classNames, LOADING_PATTERNS);
                    if (VERBOSITY && classLoading) {console.log('className', i, element.tagName, element.className);}
                }
            }
            return classLoading;
        },
        function() {
            // If any element is a visible loading / spinner image, the page is loading.
            var imageLoading = false;
            var elementList = document.querySelectorAll("*");
            var element, i, ii;
            for (i = 0, ii = elementList.length; i < ii && !imageLoading; i++) {
                element = elementList[i];
                if (element.src) {
                    imageLoading = isMemberInPatternList([element.src], URL_PATTERNS);
                    if (VERBOSITY && imageLoading) {console.log('image.src', i, element.tagName, element.src);}
                }
            }
            return imageLoading;
        },
        function() {
            // If number of list containers has changed, page is still loading.
            var _listCount = document.querySelectorAll(LIST_SELECTORS).length;
            var listLoading = _listCount !== state.listCount;
            if (VERBOSITY && listLoading) {console.log('lists', state.listCount, _listCount);}
            state.listCount = _listCount;
            return listLoading;
        },
        function() {
            // If number of list items has changed, page is still loading.
            var _itemCount = document.querySelectorAll(ITEM_SELECTORS).length;
            var itemLoading = _itemCount !== state.itemCount;
            if (VERBOSITY && itemLoading) {console.log('items', state.itemCount, _itemCount);}
            state.itemCount = _itemCount;
            return itemLoading;
        }
    ];
    var TIMEOUT_RULES = [
        function() {
            // Check maximum number of retries and time limit.
            state.retryCount = state.retryCount + 1;
            var loading = (RETRY_MAX && state.retryCount > RETRY_MAX) ? false : true;
            if (VERBOSITY && !loading) {console.log('retries', state.retryCount);}
            return loading;
        },
        function() {
            var now = new Date().getTime();
            var loading = (RETRY_UNTIL && (now > RETRY_UNTIL)) ? false : true;
            if (VERBOSITY && !loading) {console.log('timeout', new Date(now).toString());}
            return loading;
        }
    ];
    function whileLoading() {
        // If the page is loading, check again, otherwise call the callback.
        var loading = false;
        var r, rr, rule;
        for (r = 0, rr = LOADING_RULES.length; r < rr && !loading; r++) {
            rule = LOADING_RULES[r];
            loading = rule();
        }
        if (loading) {
            for (r = 0, rr = TIMEOUT_RULES.length; r < rr && loading; r++) {
                rule = TIMEOUT_RULES[r];
                loading = rule();
            }
        }
        return (loading ? setTimeout(whileLoading, RETRY_INTERVAL) : callback());
    }
    whileLoading();
};

// Paste the following line if "callback" is defined.
// callWhenReadyToGo(callback);

// Paste the following line for a simple test.
// callWhenReadyToGo(function () {console.log('done');});
