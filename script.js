(function () {
  'use strict';

  var grid = document.getElementById('workout-grid');
  var status = document.getElementById('filter-status');
  var buttons = Array.prototype.slice.call(
    document.querySelectorAll('.filter-btn')
  );

  if (!grid || !status || buttons.length === 0) {
    return;
  }

  var cards = Array.prototype.slice.call(
    grid.querySelectorAll('.card[data-type]')
  );

  function matches(card, filter) {
    if (filter === 'all') {
      return true;
    }
    return (card.dataset.type || '').toLowerCase() === filter.toLowerCase();
  }

  function applyFilter(filter) {
    var visible = 0;

    cards.forEach(function (card) {
      var show = matches(card, filter);
      card.hidden = !show;
      if (show) {
        visible += 1;
      }
    });

    buttons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.filter === filter));
    });

    status.textContent = 'Showing ' + visible + ' workouts';
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyFilter(btn.dataset.filter || 'all');
    });
  });

  var initial = buttons.find(function (btn) {
    return btn.getAttribute('aria-pressed') === 'true';
  });

  applyFilter(initial ? initial.dataset.filter || 'all' : 'all');
})();