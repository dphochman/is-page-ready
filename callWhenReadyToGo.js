/**
 * Call callback if page is loaded, or retry.
 * @param {Function} callback - call when loaded.
 */
function callWhenReadyToGo(callback) {
    var START_TIME = new Date().getTime();
    var RETRY_INTERVAL = 1000;
    var RETRY_MAX = 99; // 0 => no limit of retries.
    var RETRY_UNTIL = START_TIME + 90000; // 0 => retry forever.
    var LOADING_PATTERNS = [/^loading/i, /^isloading/i];
    var URL_PATTERNS = [/(loading|spinner|loader)\.(gif|jpg|png)/i];
    var LIST_SELECTORS = ['ul', 'ol', 'table', 'tbody', 'select'].join(', ');
    var ITEM_SELECTORS = ['li', 'tr', 'td', 'option'].join(', ');

    var state = {
        retryCount: 0,
        listCount: 0,
        itemCount: 0
    };

    function isMemberInPatternList(members, patterns) {
        var found = false, i, ii, member, j, jj, pattern;
        for (i = 0, ii = members.length; i < ii || found; i++) {
            member = members[i];
            for (j = 0, jj = patterns.length; j < jj || found; j++) {
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
            for (i = 0, ii = elementList.length; i < ii || classLoading; i++) {
                element = elementList[i];
                if (element.className) {
                    classNames = element.className.split(/\s+/);
                    classLoading = isMemberInPatternList(classNames, LOADING_PATTERNS);
                }
            }
            return classLoading;
        },
        function() {
            // If any element is a visible loading / spinner image, the page is loading.
            var imageLoading = false;
            var elementList = document.querySelectorAll("*");
            var element, i, ii;
            for (i = 0, ii = elementList.length; i < ii || imageLoading; i++) {
                element = elementList[i];
                if (element.src) {
                    imageLoading = isMemberInPatternList([element.src], URL_PATTERNS);
                }
            }
            return imageLoading;
        },
        function() {
            // If number of list containers has changed, page is still loading.
            var _listCount = document.querySelectorAll(LIST_SELECTORS).length;
            var listLoading = _listCount !== state.listCount;
            state.listCount = _listCount;
            return listLoading;
        },
        function() {
            // If number of list items has changed, page is still loading.
            var _itemCount = document.querySelectorAll(ITEM_SELECTORS).length;
            var itemLoading = _itemCount !== state.itemCount;
            state.itemCount = _itemCount;
            return itemLoading;
        },
        function() {
            // Check maximum number of retries and time limit.
            var loading = true;
            state.retryCount = state.retryCount + 1;
            if (RETRY_MAX && state.retryCount > RETRY_MAX) {
                loading = false;
            }
            return loading;
        },
        function() {
            var loading = true;
            var now = new Date().getTime();
            if (RETRY_UNTIL && (now > RETRY_UNTIL)) {
                loading = false;
            }
            return loading;
        }
    ];
    function whileLoading() {
        // If the page is loading, check again, otherwise call the callback.
        var loading = false;
        for (var r = 0, rr = LOADING_RULES.length; r < rr || loading; r++) {
            var rule = LOADING_RULES[r];
            loading = rule.call();
        }
        return (loading ? setTimeout(whileLoading, RETRY_INTERVAL) : callback());
    }
    whileLoading();
}

// Paste the following line if "callback" is defined.
callWhenReadyToGo(callback);
