// Manually rotating at a high frame rate is less CPU intensive
// than CSS animations or transitions.
// Might have to do with the kind of video card/accelleration here.
// Chrome 51, Mac OSX

(function () {
  'use strict'

  // Run updates every 60 ms to get a smooth
  // framerate...
  var msUpdate = 60
  var clock = document.querySelector('.clock')
  var msSeconds = 60000
  var msMinutes = msSeconds * 60
  var msHours = msMinutes * 12
  var hands = [
    Hand('seconds', msSeconds),
    Hand('minutes', msMinutes),
    Hand('hours', msHours)
  ]


  // Toggles between 60ms/1000ms framerate
  // when the user clicks the screen
  document.addEventListener('click', function () {
    msUpdate = (msUpdate === 60 ? 1000 : 60)
  })


  // An individual hand of the clock.
  function Hand(unit, maxVal) {
    var hand = clock.querySelector('.clock-' + unit)

    return {
      update(ms) {
        var percent = ms/maxVal
        var deg = 360 * percent
        hand.style.transform = 'rotate(' + deg + 'deg)'
      }
    }
  }


  // Gets the current time in milliseconds
  function tickMs() {
    var now = new Date()

    var hours = (now.getHours() % 12) * msMinutes
    var minutes = now.getMinutes() * msSeconds
    var seconds = now.getSeconds() * 1000
    var ms = now.getMilliseconds()

    return ms + seconds + minutes + hours
  }


  // Updates each hand with the curren time
  function updateHands() {
    var ticks = tickMs()
    hands.forEach(function (hand) {
      hand.update(ticks)
    })
  }


  // Updates the clock every msUpdate milliseconds
  updateHands()

  setTimeout(function runUpdates() {
    updateHands()
    setTimeout(runUpdates, msUpdate)
  }, msUpdate)

}());
