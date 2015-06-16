(function () {
  var pics = [
    {
      id: 'cookies',
      text: 'I like to eat cookies.' 
    }, {
      id: 'doodle',
      text: 'I like doodling in meetings, because everyone thinks I\'m busy taking notes.'
    }, {
      id: 'nap',
      text: 'I like napping.'
    }, {
      id: 'mooostache',
      text: 'I like being ridiculous.'
    }
  ];
  
  var index = Math.floor(Math.random() * pics.length);
  var img = new Image();
  
  img.onload = function () {
    var pic = document.querySelector('.profile-pic');
    pic.src = img.src;
    pic.className += ' loaded';
  };
  
  img.src = './img/' + pics[index].id + '.png';
})();