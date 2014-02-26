$(function () {
    // oktmpl extensions
    function zeroPad(num, places) {
        return (Array(places).join("0") + num.toString()).slice(-places);
    }

    function formatDuration(totalSeconds) {
        var duration = moment.duration(totalSeconds, 'seconds');
        return Math.floor(duration.asHours()) + ':' + zeroPad(duration.minutes(), 2) + '.' + zeroPad(duration.seconds(), 2);
    }

    oktmpl.fetchView = function (name) {
        var view = document.getElementById(name).innerHTML;
        return new oktmpl.promise(view);
    }

    oktmpl.filter.className = function (cond, name) {
        return cond ? escape(name) : '';
    }

    oktmpl.filter.duration = function (totalSeconds) {
        return formatDuration(totalSeconds);
    }


    /**
     * Provides identifiers (integers) unique to a set.
     * @constructor
     * @param {Array} set - An array of objects with an 'id' property, used to determine the next unique id.
     */
    function Identifiers(set) {
        var nextId = 1;
        (set || []).forEach(function (obj) {
            if (obj.id > nextId) nextId = obj.id;
        });

        this.nextId = nextId;
    }

    Identifiers.prototype = {
        next: function () {
            return ++this.nextId;
        }
    }

    var ArrayHelper = {
        set: function (arr, item) {
            arr = arr || [];

            for (var i = 0; i < arr.length; ++i) {
                if (arr[i].id == item.id) {
                    arr[i] = item;
                    return;
                }
            }

            arr.push(item);
        },

        first: function (arr, fn) {
            arr = arr || [];
            for (var i = 0; i < arr.length; ++i) {
                if (fn(arr[i])) {
                    return arr[i];
                }
            }
        }
    }
    

    /*
    DB.Timers.set(timer);
    DB.Timers.remove(timer);
    DB.Times.add(time);
    DB.Times.removeOlderThan(date);
    DB.Times.removeForTimer(timer);
    DB.Timers.all();
    DB.Times.all();
    */
    var DB = (function () {
        var db = {
            timers: [],
            times: []
        },
        ids = new Identifiers();
        
        return {
            load: function () {
                db = JSON.parse(localStorage.getItem('times.db')) || db;
                ids = new Identifiers(db.timers);
            },

            save: function () {
                localStorage.setItem('times.db', JSON.stringify(db));
            },

            Timers: {
                all: function () {
                    return db.timers;
                },

                byId: function (id) {
                    return ArrayHelper.first(db.timers, function (obj) { return obj.id == id; });
                },

                save: function (timer) {
                    if (!timer.id) {
                        timer.id = ids.next();
                    }

                    ArrayHelper.set(db.timers, timer);
                },

                remove: function (timer) {
                    db.timers = db.timers.filter(function (t) {
                        return t.id != timer.id;
                    });
                }
            },

            Times: {
                all: function () {
                    return db.times;
                },

                add: function (time) {
                    db.times.push(time);
                },

                removeOlderThan: function (date) {
                    date = moment(date).unix();
                    db.times = db.times.filter(function (time) {
                        return moment(time.start).unix() > date;
                    });
                },

                removeForTimer: function (timer) {
                    db.times = db.times.filter(function (time) {
                        return time.timerId != timer.id;
                    });
                }
            }
        };
    })();



    // Initialization
    DB.load();
    
    var timers = $('.timers'),
        timersListTemplate = 'timers-list';

    function refreshTimers() {
        oktmpl.render(timersListTemplate, DB.Timers.all()).then(function (result) {
            timers.html(result);
        });
    }
    
    refreshTimers();


    // Interaction
    function showModal(modalName, model) {
        var promise = new oktmpl.promise();
        oktmpl.render(modalName, model).then(function (html) {
            var element = $(html);
            $(document.body).append(element);

            setTimeout(function () {
                scrollTo(0, 0);
                element.addClass('open');
                promise.resolve(element);
            }, 10);
        });

        return promise;
    }

    function hideNewTimerForm() {
        $('.new-timer-form').hide()[0].reset();
        $('#new-timer').fadeIn();
    }

    function addNewTimer(name) {
        DB.Timers.save({
            name: name,
            totalSeconds: 0,
            start: undefined
        });

        refreshTimers();

        DB.save();
    }

    $(document.body).on('click', '.modal .cancel', function () {
        var modal = $(this).closest('.modal');
        modal.removeClass('open');
        setTimeout(function () {
            modal.remove();
        }, 500);
    });

    function updateTime(timer) {
        var time = DB.Timers.byId(timer.data('timer')),
            timeElement = $('.timer-time', timer),
            elapsedSeconds = moment().diff(time.start, 'seconds');

        timeElement.text(formatDuration(elapsedSeconds + time.totalSeconds));
    }

    var activatedTimeout;
    function activatedTimer() {
        function refreshActiveTimers() {
            var activeTimersExist = false;
            $('.timer.active').each(function () {
                updateTime($(this));
                activeTimersExist = true;
            });

            if (!activeTimersExist) {
                clearInterval(activatedTimeout);
            }
        }

        clearInterval(activatedTimeout);
        refreshActiveTimers();
        activatedTimeout = setInterval(refreshActiveTimers, 1000);
    }

    activatedTimer();

    $(document.body).on('click', '.delete-timer', function () {
        if (confirm('Do you want to delete this timer?')) {
            var form = $(this).closest('form'),
                timer = foj(form).toObj();

            DB.Timers.remove(timer);
            DB.Times.removeForTimer(timer);
            DB.save();
            refreshTimers();
            form.remove();
        }
    });

    $(document.body).on('submit', '.timer-edit-form', function () {
        var id = parseInt($('input[name=id]', this).val(), 10),
            timer = DB.Timers.byId(id);

        timer = foj(this).toObj(timer);
        timer.id = id;
        timer.totalSeconds = timer.totalSeconds || 0;
        DB.Timers.save(timer);
        DB.save();

        $(this).remove();
        refreshTimers();
        return false;
    });

    function timesToCsv() {
        var csv = 'Name\tStart\tEnd\tElapsed Seconds\n',
            timers = {},
            times = DB.Times.all();

        DB.Timers.all().forEach(function (timer) {
            timers[timer.id] = timer;
        });

        for (var i = 0; i < times.length; ++i) {
            var time = times[i],
                timer = timers[time.timerId];

            csv += [timer.name, time.start, time.end, time.elapsedSeconds].join('\t') + '\n';
        }

        return csv;
    }
    
    $(document.body).on('click', '.reset-timers', function () {
        DB.Timers.all().forEach(function (timer) {
            timer.totalSeconds = 0;
            timer.start = undefined;
        });

        DB.Times.removeOlderThan(moment().startOf('week').subtract('days', 28));

        DB.save();
        refreshTimers();
    });

    $(document.body).on('click', '.download-csv', function () {
        var csv = timesToCsv();
        if (window.Blob && window.saveAs) {
            var blob = new Blob([csv], { type: "text/plain;charset=utf-8" });
            saveAs(blob, "time-journal.csv");
        } else {
            showModal('csv-results', { csv: csv }).then(function (html) {
                var range = document.createRange(),
                    csvNode = $('.csv-content')[0];

                range.selectNodeContents(csvNode);

                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            });
        }        
    });

    $(document.body).on('click', '.timer-edit, .timer-add', function () {
        var button = $(this),
            timerElement = button.closest('.timer'),
            timer = DB.Timers.byId(timerElement.data('timer'));

        showModal('edit-timer', timer || { name: '' }).then(function (html) {
            $('#timerName').focus().select();
        });
    });

    $('.timers').on('click', '.timer-toggle', function () {
        var button = $(this),
            timerElement = button.closest('.timer'),
            timer = DB.Timers.byId(timerElement.data('timer'));

        if (timerElement.toggleClass('active').hasClass('active')) {
            timer.start = moment();
            activatedTimer();
        } else {
            updateTime(timerElement);
            var end = moment(),
                elapsedSeconds = end.diff(timer.start, 'seconds');

            timer.totalSeconds += elapsedSeconds;
            DB.Times.add({
                timerId: timer.id,
                start: timer.start,
                end: end,
                elapsedSeconds: elapsedSeconds
            });

            timer.start = undefined;
        }

        DB.save();
        return false;
    });
});