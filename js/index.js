(function () {
    function $one(selector) {
        return document.querySelector(selector);
    }

    function $all(selector, fn) {
        var nodes = document.querySelectorAll(selector);
        if (fn) {
            for (var i = 0; i < nodes.length; ++i) {
                fn(nodes[i]);
            }
        }
        return nodes;
    }
    
    var silly = [
        {
            id: 'cookies',
            text: 'I like to eat cookies.' 
        },
        {
            id: 'doodle',
            text: 'I like doodling in meetings, because everyone thinks I\'m busy taking notes.'
        },
        {
            id: 'nap',
            text: 'I like napping.'
        },
        {
            id: 'mooostache',
            text: 'I like being ridiculous.'
        },
    ];

    var index = Math.floor(Math.random() * silly.length);

    $one('#silly-img').setAttribute('src', '/img/' + silly[index].id + '.png');
    $one('#silly-text').textContent = silly[index].text;
    $all('.loading', function (n) {
        n.classList.remove('loading');
    });
    $one('#email-me').setAttribute('href', 'mailto:' + 'ferociousturtle' + '@' + 'gmail.com');
})();