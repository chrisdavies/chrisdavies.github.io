function foj(form) {
    return new foj.instance(form);
}

foj.makeArray = function (name, obj) {
    var isArr = name.charAt(name.length - 1) === ']';

    if (isArr) {
        var pieces = name.substr(0, name.length - 1).split('[');
        name = pieces[0];
        var arr = obj[name] || (obj[name] = []);
        var i = parseInt(pieces[1]);
        return isNaN(i) ? arr : arr[i] || (arr[i] = {});
    }

    return null;
};

foj.makeField = function (name, obj) {
    var arr = foj.makeArray(name, obj);
    if (arr) return arr;

    return obj[name] || (obj[name] = {});
};

foj.writeField = function (name, val, obj) {
    var arr = foj.makeArray(name, obj);

    if (arr) arr.push(val);
    else obj[name] = val;

    return val;
};

foj.read = function (name, obj) {
    var a = name.split('.');
    while (obj && a.length) {
        obj = obj[a.shift()];
    }
    return obj;
};

foj.write = function (name, val, obj) {
    if (val === undefined || val === '') return val;

    var a = name.split('.');
    while (a.length > 1) {
        obj = foj.makeField(a.shift(), obj);
    }

    foj.writeField(a.shift(), val, obj);
    return val;
};

foj.remove = function (name, obj) {
    var a = name.split('.');
    while (a.length > 1) {
        obj = obj[a.shift().replace('[]', '')];
        if (obj === undefined) return;
    }

    delete obj[a.shift().replace('[]', '')]
};

foj.strip = function (form, obj) {
    var inputNames = {};
    form.children(':input[name]').addBack(':input[name]').each(function () {
        var name = this.name,
            arrIndex = name.indexOf('[');

        arrIndex >= 0 && (name = name.substr(0, arrIndex));

        if (!inputNames[name]) {
            inputNames[name] = true;
            foj.remove(name, obj);
        }
    });
};

foj.instance = function (form) {
    this.form = $(form);
};

foj.removeEmptyArrayItems = function (obj) {
    function cleanArrays(o) {
        if (!o) return;

        for (var field in o) {
            var oldArr = o[field] || [];
            if (oldArr.remove && typeof (oldArr.remove) === 'function') {
                oldArr.remove(undefined);
            } else if (oldArr.shift && typeof (oldArr.shift) === 'function') {
                var arr = [];
                while (oldArr.length) {
                    var item = oldArr.shift();
                    if (item !== undefined) {
                        arr.push(item);
                    }
                }

                oldArr.push.apply(oldArr, arr);
            } else if (typeof (oldArr) == 'object') {
                cleanArrays(oldArr);
            }
        }
    }

    cleanArrays(obj);
}

foj.fillUrl = function (url, obj) {
    function readForUrl(match) {
        var val = foj.read(match.substr(1, match.length - 2), obj);
        return val !== undefined ? encodeURIComponent(val) : '';
    }

    return url.replace(/\{([^\{\}]*)\}/g, readForUrl);
}

foj.instance.prototype = {
    toObj: function (obj) {
        obj = obj || {};
        foj.strip(this.form, obj);

        var disabled = this.form.find(':input:disabled').removeAttr('disabled'),
            nameVals = this.form.serializeArray();
        disabled.attr('disabled', 'disabled');

        while (nameVals.length) {
            var nv = nameVals.shift();
            if ($.trim(nv.value)) {
                foj.write(nv.name, nv.value, obj);
            }
        }

        foj.removeEmptyArrayItems(obj);

        return obj;
    },

    submit: function (options, nvObj) {
        options = options || {};
        var button = $('button', this.form).attr('disabled', 'disabled'),
            errMessage = $('.error-message-wrap', this.form).fadeOut('fast'),
            obj = nvObj || this.toObj(options.data);

        return jjax($.extend({
            type: this.form.attr('method'),
            url: foj.fillUrl(this.form.attr('action'), obj),
            data: obj
        }, options || {})).fail(function (e) {
            $('.error-message', errMessage).text(e.message);
            errMessage.fadeIn();
        }).always(function () {
            button.removeAttr('disabled');
        });
    },

    validate: function () {
        var isValid = true,
            requiredText = 'This field is required.';

        $('.question .error-message-wrap', this.form).remove();

        function insertError(forElement) {
            isValid = false;
            $('.question-title', forElement.closest('.question')).after(dotv('/shared/error-message', { msg: requiredText }));
        }

        $(':input[required]', this.form).filter(':not([type=checkbox], [type=radio])').each(function () {
            if (!$.trim($(this).val())) insertError($(this));
        });

        var checkable = $('input[type=radio][required],input[type=checkbox][required]', this.form),
            required = checkable.filter(':checked'),
            lastFieldName;

        function filterCheckable(name) {
            checkable = checkable.filter(':not([name="' + name + '"])');
        }

        required.each(function () {
            var thisName = $(this).attr('name');
            if (thisName != lastFieldName) filterCheckable(thisName);
            lastFieldName = thisName;
        });

        if (checkable.length) {
            insertError(checkable.first());
            isValid = false;
        }

        var wrap = $('.error-message-wrap');
        wrap.length && wrap.first().closest('.question')[0].scrollIntoView();

        return isValid;
    }
};
